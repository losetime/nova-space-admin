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
import {
  CreatePushRecordDto,
  UpdatePushRecordDto,
  QueryPushRecordDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('push-records')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PushRecordController {
  constructor(private pushRecordService: PushRecordService) {}

  @Get()
  findAll(@Query() query: QueryPushRecordDto) {
    return this.pushRecordService.findAll(query);
  }

  @Get('statistics')
  getStatistics() {
    return this.pushRecordService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pushRecordService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePushRecordDto) {
    return this.pushRecordService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePushRecordDto) {
    return this.pushRecordService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pushRecordService.remove(id);
  }
}