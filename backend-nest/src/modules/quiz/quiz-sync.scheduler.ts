import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QuizSyncService } from './quiz-sync.service';

@Injectable()
export class QuizSyncScheduler {
  private readonly logger = new Logger(QuizSyncScheduler.name);

  constructor(private readonly quizSyncService: QuizSyncService) {}

  // 动态定时任务 - 默认每天凌晨3点执行
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleDailySync() {
    const config = this.quizSyncService.getConfig();

    if (!config.enabled) {
      this.logger.debug('定时同步已禁用，跳过');
      return;
    }

    this.logger.log('开始定时同步题目...');
    try {
      const result = await this.quizSyncService.syncQuizzes(config.count);
      this.logger.log(`定时同步完成: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error('定时同步失败', error);
    }
  }
}