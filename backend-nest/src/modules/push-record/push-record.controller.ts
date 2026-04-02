import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PushRecordService } from './push-record.service';
import { PushSchedulerService } from './push-scheduler.service';
import {
  CreatePushRecordDto,
  UpdatePushRecordDto,
  QueryPushRecordDto,
  TestPushDto,
  QuerySubscriptionDto,
  UpdateSubscriptionDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('push-records')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PushRecordController {
  constructor(
    private pushRecordService: PushRecordService,
    private pushSchedulerService: PushSchedulerService,
  ) {}

  @Get()
  findAll(@Query() query: QueryPushRecordDto) {
    return this.pushRecordService.findAll(query);
  }

  @Get('statistics')
  getStatistics() {
    return this.pushRecordService.getStatistics();
  }

  @Get('subscriptions')
  async getSubscriptions(@Query() query: QuerySubscriptionDto) {
    return this.pushRecordService.getSubscriptions(query);
  }

  @Get('subscriptions/statistics')
  async getSubscriptionStatistics() {
    return this.pushRecordService.getSubscriptionStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pushRecordService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePushRecordDto) {
    return this.pushRecordService.create(dto);
  }

  @Post('test')
  async testPush(@Body() dto: TestPushDto): Promise<{ success: boolean; message: string }> {
    const sent = await this.pushSchedulerService.triggerSimpleTestPush(dto.email);
    if (sent) {
      return { success: true, message: '测试推送已发送，请检查邮箱' };
    }
    return { success: false, message: '推送发送失败，请检查邮件配置' };
  }

  @Post('test-digest')
  async testDigestPush(@Body() dto: TestPushDto): Promise<{ success: boolean; message: string }> {
    const sent = await this.pushSchedulerService.triggerAdminTestPush(dto.email);
    if (sent) {
      return { success: true, message: '资讯推送已发送，请检查邮箱' };
    }
    return { success: false, message: '推送发送失败，请检查邮件配置' };
  }

  @Post('trigger')
  async triggerPush() {
    return this.pushSchedulerService.handleDailyPush();
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePushRecordDto) {
    return this.pushRecordService.update(id, dto);
  }

  @Put('subscriptions/:id')
  async updateSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.pushRecordService.updateSubscription(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pushRecordService.remove(id);
  }
}