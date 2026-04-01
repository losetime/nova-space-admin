import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MilestoneController } from './milestone.controller';
import { MilestoneService } from './milestone.service';
import { Milestone } from './entities/milestone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Milestone])],
  controllers: [MilestoneController],
  providers: [MilestoneService],
  exports: [MilestoneService],
})
export class MilestoneModule {}