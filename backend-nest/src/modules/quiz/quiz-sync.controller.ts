import { Controller, Post, Get, Put, Body, UseGuards } from '@nestjs/common';
import { QuizSyncService, SyncConfig } from './quiz-sync.service';
import { SyncDto, SyncConfigDto } from './dto/sync.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('quiz')
@UseGuards(JwtAuthGuard, AdminGuard)
export class QuizSyncController {
  constructor(private readonly quizSyncService: QuizSyncService) {}

  @Post('sync')
  async syncQuizzes(@Body() dto: SyncDto) {
    return this.quizSyncService.syncQuizzes(dto.count);
  }

  @Get('stats')
  async getStats() {
    return this.quizSyncService.getStats();
  }

  @Get('config')
  async getConfig() {
    return this.quizSyncService.getConfig();
  }

  @Put('config')
  async updateConfig(@Body() dto: SyncConfigDto) {
    return this.quizSyncService.updateConfig(dto);
  }
}