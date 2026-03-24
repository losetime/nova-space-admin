import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quiz } from './entities/quiz.entity';
import { QuizSyncService } from './quiz-sync.service';
import { QuizSyncController } from './quiz-sync.controller';
import { QuizSyncScheduler } from './quiz-sync.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([Quiz])],
  controllers: [QuizSyncController],
  providers: [QuizSyncService, QuizSyncScheduler],
  exports: [QuizSyncService],
})
export class QuizModule {}