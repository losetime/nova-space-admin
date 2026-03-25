import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushRecordController } from './push-record.controller';
import { PushRecordService } from './push-record.service';
import { PushSchedulerService } from './push-scheduler.service';
import { EmailService } from './email.service';
import { DigestService } from './digest.service';
import { PushRecord } from './entities/push-record.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { Intelligence } from '../intelligence/entities/intelligence.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PushRecord, PushSubscription, Intelligence]),
  ],
  controllers: [PushRecordController],
  providers: [PushRecordService, PushSchedulerService, EmailService, DigestService],
  exports: [PushRecordService, PushSchedulerService, EmailService],
})
export class PushRecordModule {}