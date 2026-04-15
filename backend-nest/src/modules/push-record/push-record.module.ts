import { Module } from "@nestjs/common";
import { PushRecordController } from "./push-record.controller";
import { PushRecordService } from "./push-record.service";
import { PushSchedulerService } from "./push-scheduler.service";
import { EmailService } from "./email.service";
import { DigestService } from "./digest.service";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [PushRecordController],
  providers: [
    PushRecordService,
    PushSchedulerService,
    EmailService,
    DigestService,
  ],
  exports: [PushRecordService, PushSchedulerService, EmailService],
})
export class PushRecordModule {}
