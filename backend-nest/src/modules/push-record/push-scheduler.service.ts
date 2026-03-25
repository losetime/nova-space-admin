import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushRecord } from './entities/push-record.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { EmailService } from './email.service';
import { DigestService } from './digest.service';
import { PushTriggerType, PushRecordStatus } from '../../common/enums/push.enum';

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
}