import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { eq, and, between, inArray } from 'drizzle-orm';
import { Database } from '../../database';
import { pushRecords, pushSubscriptions } from '../../database/schema/push';
import { EmailService } from './email.service';
import { DigestService } from './digest.service';

@Injectable()
export class PushSchedulerService {
  private readonly logger = new Logger(PushSchedulerService.name);

  constructor(
    @Inject('DATABASE') private db: Database,
    private emailService: EmailService,
    private digestService: DigestService,
    private configService: ConfigService,
  ) {}

  async triggerManualPush(userId: string): Promise<boolean> {
    const result = await this.db.select().from(pushSubscriptions).where(eq(pushSubscriptions.user_id, userId)).limit(1);
    const subscription = result[0];

    if (!subscription) {
      this.logger.warn(`No subscription found for user ${userId}`);
      return false;
    }

    try {
      const content = await this.digestService.generateDigestContent(subscription as any);
      const sent = await this.emailService.sendDailyDigest(subscription.email, content);

      await this.db.insert(pushRecords).values({
        user_id: userId,
        trigger_type: 'manual',
        subject: `Nova Space 测试推送 - ${content.date}`,
        content: JSON.stringify(content),
        sent_at: new Date(),
        status: sent ? 'sent' : 'failed',
      } as any);

      if (sent) {
        await this.db.update(pushSubscriptions).set({ last_push_at: new Date() }).where(eq(pushSubscriptions.user_id, userId));
      }

      return sent;
    } catch (error) {
      this.logger.error(`Failed to send manual push to user ${userId}`, error);
      return false;
    }
  }

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

  async triggerSimpleTestPush(email: string): Promise<boolean> {
    return this.emailService.sendTestEmail(email);
  }

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

  private async getActiveSubscriptions(): Promise<any[]> {
    return this.db
      .select()
      .from(pushSubscriptions)
      .where(and(eq(pushSubscriptions.enabled, true), eq(pushSubscriptions.status, 'active')));
  }

  private async filterTodayUnpushed(subscriptions: any[]): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return subscriptions.filter((sub) => {
      if (!sub.last_push_at) return true;

      const lastPushDate = new Date(sub.last_push_at);
      lastPushDate.setHours(0, 0, 0, 0);

      return lastPushDate < today;
    });
  }

  private async batchPush(subscriptions: any[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const batchSize = this.configService.get<number>('app.push.batchSize') || 10;
    const batchInterval = this.configService.get<number>('app.push.batchInterval') || 1;

    for (let i = 0; i < subscriptions.length; i += batchSize) {
      const batch = subscriptions.slice(i, i + batchSize);

      const results = await Promise.allSettled(batch.map((sub) => this.sendToUser(sub)));

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

  private async sendToUser(subscription: any): Promise<boolean> {
    try {
      const content = await this.digestService.generateDigestContent(subscription);

      const sent = await this.emailService.sendDailyDigest(subscription.email, content);

      await this.recordPushResult(subscription, content, sent);

      if (sent) {
        await this.db.update(pushSubscriptions).set({ last_push_at: new Date() }).where(eq(pushSubscriptions.id, subscription.id));
      }

      return sent;
    } catch (error) {
      this.logger.error(`推送失败：${subscription.email}`, error);
      await this.recordPushResult(subscription, null, false, error.message);
      return false;
    }
  }

  private async recordPushResult(subscription: any, content: any, success: boolean, errorMessage?: string): Promise<void> {
    await this.db.insert(pushRecords).values({
      user_id: subscription.user_id,
      trigger_type: 'scheduled',
      subject: `Nova Space 每日资讯 - ${new Date().toLocaleDateString('zh-CN')}`,
      content: content ? JSON.stringify(content) : '',
      sent_at: new Date(),
      status: success ? 'sent' : 'failed',
      error_message: errorMessage || null,
    } as any);
  }

  private async getFailedRecordsForRetry(): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    return this.db
      .select()
      .from(pushRecords)
      .where(and(eq(pushRecords.status, 'failed'), eq(pushRecords.trigger_type, 'scheduled'), between(pushRecords.created_at, today, oneHourAgo)))
      .limit(50);
  }

  private async retryPush(records: any[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const record of records) {
      try {
        const subResult = await this.db.select().from(pushSubscriptions).where(eq(pushSubscriptions.user_id, record.user_id)).limit(1);
        const subscription = subResult[0];

        if (!subscription) {
          this.logger.warn(`找不到订阅：${record.user_id}`);
          continue;
        }

        const content = await this.digestService.generateDigestContent(subscription as any);
        const sent = await this.emailService.sendDailyDigest(subscription.email, content);

        await this.db
          .update(pushRecords)
          .set({
            status: sent ? 'sent' : 'failed',
            error_message: sent ? null : `重试失败 ${new Date().toISOString()}`,
          })
          .where(eq(pushRecords.id, record.id));

        if (sent) {
          success++;
          await this.db.update(pushSubscriptions).set({ last_push_at: new Date() }).where(eq(pushSubscriptions.user_id, record.user_id));
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