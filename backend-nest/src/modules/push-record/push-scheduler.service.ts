import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { PushRecord } from './entities/push-record.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { EmailService } from './email.service';
import { DigestService } from './digest.service';
import { 
  PushTriggerType, 
  PushRecordStatus, 
  PushSubscriptionStatus 
} from '../../common/enums/push.enum';

@Injectable()
export class PushSchedulerService {
  private readonly logger = new Logger(PushSchedulerService.name);

  constructor(
    @InjectRepository(PushRecord)
    private pushRecordRepository: Repository<PushRecord>,
    @InjectRepository(PushSubscription)
    private pushSubscriptionRepository: Repository<PushSubscription>,
    private emailService: EmailService,
    private digestService: DigestService,
    private configService: ConfigService,
  ) {}

  // 手动触发推送（用于测试或管理员操作）
  async triggerManualPush(userId: string): Promise<boolean> {
    const subscription = await this.pushSubscriptionRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      this.logger.warn(`No subscription found for user ${userId}`);
      return false;
    }

    try {
      const content = await this.digestService.generateDigestContent(subscription);
      const sent = await this.emailService.sendDailyDigest(
        subscription.email,
        content,
      );

      // 记录推送结果
      const record = this.pushRecordRepository.create({
        userId,
        triggerType: PushTriggerType.MANUAL,
        subject: `Nova Space 测试推送 - ${content.date}`,
        content: JSON.stringify(content),
        sentAt: new Date(),
        status: sent ? PushRecordStatus.SENT : PushRecordStatus.FAILED,
      });

      await this.pushRecordRepository.save(record);

      if (sent) {
        await this.pushSubscriptionRepository.update(
          { userId },
          { lastPushAt: new Date() },
        );
      }

      return sent;
    } catch (error) {
      this.logger.error(`Failed to send manual push to user ${userId}`, error);
      return false;
    }
  }

  // 管理员批量测试推送（发送到指定邮箱，不需要订阅）
  async triggerAdminTestPush(email: string): Promise<boolean> {
    try {
      const content = await this.digestService.generateSimpleDigest();
      const sent = await this.emailService.sendDailyDigest(email, content);

      return sent;
    } catch (error) {
      this.logger.error(`Failed to send admin test push to ${email}`, error);
      return false;
    }
  }

  // 发送简单测试邮件
  async triggerSimpleTestPush(email: string): Promise<boolean> {
    return this.emailService.sendTestEmail(email);
  }

  // 每日定时推送任务（早上 8:00）
  @Cron('0 8 * * *', {
    name: 'dailyPush',
    timeZone: 'Asia/Shanghai',
  })
  async handleDailyPush() {
    const pushEnabled = this.configService.get<boolean>('app.push.enabled');
    if (!pushEnabled) {
      this.logger.log('Push is disabled, skipping daily push');
      return;
    }

    this.logger.log('开始执行每日推送任务');

    try {
      const subscriptions = await this.getActiveSubscriptions();
      const needPushUsers = await this.filterTodayUnpushed(subscriptions);

      if (needPushUsers.length === 0) {
        this.logger.log('所有用户今天都已推送，跳过');
        return;
      }

      const results = await this.batchPush(needPushUsers);

      this.logger.log(`推送完成：成功 ${results.success}, 失败 ${results.failed}`);
    } catch (error) {
      this.logger.error('每日推送任务执行失败', error);
    }
  }

  // 每小时重试失败推送
  @Cron('0 * * * *', {
    name: 'retryFailedPush',
    timeZone: 'Asia/Shanghai',
  })
  async handleRetryFailedPush() {
    this.logger.log('检查失败推送记录');

    try {
      const failedRecords = await this.getFailedRecordsForRetry();

      if (failedRecords.length === 0) {
        return;
      }

      this.logger.log(`重试 ${failedRecords.length} 条失败推送`);

      const results = await this.retryPush(failedRecords);

      this.logger.log(`重试完成：成功 ${results.success}, 失败 ${results.failed}`);
    } catch (error) {
      this.logger.error('重试任务执行失败', error);
    }
  }

  // 获取活跃订阅用户
  private async getActiveSubscriptions(): Promise<PushSubscription[]> {
    return this.pushSubscriptionRepository.find({
      where: {
        enabled: true,
        status: PushSubscriptionStatus.ACTIVE,
      },
      relations: ['user'],
    });
  }

  // 筛选当天未推送的用户
  private async filterTodayUnpushed(
    subscriptions: PushSubscription[],
  ): Promise<PushSubscription[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return subscriptions.filter((sub) => {
      if (!sub.lastPushAt) return true;

      const lastPushDate = new Date(sub.lastPushAt);
      lastPushDate.setHours(0, 0, 0, 0);

      return lastPushDate < today;
    });
  }

  // 批量推送
  private async batchPush(
    subscriptions: PushSubscription[],
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const batchSize = this.configService.get<number>('app.push.batchSize') || 10;
    const batchInterval = this.configService.get<number>('app.push.batchInterval') || 1;

    for (let i = 0; i < subscriptions.length; i += batchSize) {
      const batch = subscriptions.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map((sub) => this.sendToUser(sub)),
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          success++;
        } else {
          failed++;
        }
      });

      if (i + batchSize < subscriptions.length) {
        await new Promise((resolve) => setTimeout(resolve, batchInterval * 1000));
      }
    }

    return { success, failed };
  }

  // 发送单个用户
  private async sendToUser(subscription: PushSubscription): Promise<boolean> {
    try {
      const content = await this.digestService.generateDigestContent(subscription);

      const sent = await this.emailService.sendDailyDigest(
        subscription.email,
        content,
      );

      await this.recordPushResult(subscription, content, sent);

      if (sent) {
        await this.pushSubscriptionRepository.update(
          { id: subscription.id },
          { lastPushAt: new Date() },
        );
      }

      return sent;
    } catch (error) {
      this.logger.error(`推送失败：${subscription.email}`, error);
      await this.recordPushResult(subscription, null, false, error.message);
      return false;
    }
  }

  // 记录推送结果
  private async recordPushResult(
    subscription: PushSubscription,
    content: any,
    success: boolean,
    errorMessage?: string,
  ): Promise<void> {
    const record = this.pushRecordRepository.create({
      userId: subscription.userId,
      triggerType: PushTriggerType.SCHEDULED,
      subject: `Nova Space 每日资讯 - ${new Date().toLocaleDateString('zh-CN')}`,
      content: content ? JSON.stringify(content) : '',
      sentAt: new Date(),
      status: success ? PushRecordStatus.SENT : PushRecordStatus.FAILED,
      errorMessage: errorMessage || null,
    });

    await this.pushRecordRepository.save(record);
  }

  // 获取失败记录用于重试
  private async getFailedRecordsForRetry(): Promise<PushRecord[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    return this.pushRecordRepository.find({
      where: {
        status: PushRecordStatus.FAILED,
        triggerType: PushTriggerType.SCHEDULED,
        createdAt: Between(today, oneHourAgo),
      },
      take: 50,
    });
  }

  // 重试失败推送
  private async retryPush(
    records: PushRecord[],
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const record of records) {
      try {
        const subscription = await this.pushSubscriptionRepository.findOne({
          where: { userId: record.userId },
        });

        if (!subscription) {
          this.logger.warn(`找不到订阅：${record.userId}`);
          continue;
        }

        const content = await this.digestService.generateDigestContent(subscription);
        const sent = await this.emailService.sendDailyDigest(
          subscription.email,
          content,
        );

        await this.pushRecordRepository.update(
          { id: record.id },
          {
            status: sent ? PushRecordStatus.SENT : PushRecordStatus.FAILED,
            errorMessage: sent ? null : `重试失败 ${new Date().toISOString()}`,
          },
        );

        if (sent) {
          success++;
          await this.pushSubscriptionRepository.update(
            { userId: record.userId },
            { lastPushAt: new Date() },
          );
        } else {
          failed++;
        }
      } catch (error) {
        this.logger.error(`重试失败：${record.id}`, error);
        failed++;
      }
    }

    return { success, failed };
  }
}