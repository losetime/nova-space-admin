import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushRecordController } from './push-record.controller';
import { PushRecordService } from './push-record.service';
import { PushRecord } from './entities/push-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PushRecord])],
  controllers: [PushRecordController],
  providers: [PushRecordService],
  exports: [PushRecordService],
})
export class PushRecordModule {}