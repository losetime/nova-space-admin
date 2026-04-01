import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MilestoneService } from './milestone.service';
import { CreateMilestoneDto, UpdateMilestoneDto, QueryMilestoneDto } from './dto/milestone.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('milestones')
@UseGuards(JwtAuthGuard, AdminGuard)
export class MilestoneController {
  constructor(private readonly milestoneService: MilestoneService) {}

  @Get()
  findAll(@Query() query: QueryMilestoneDto) {
    return this.milestoneService.findAll(query);
  }

  @Get('categories')
  getCategories() {
    return this.milestoneService.getCategories();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.milestoneService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMilestoneDto) {
    return this.milestoneService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMilestoneDto) {
    return this.milestoneService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.milestoneService.remove(id);
  }

  @Patch(':id/publish')
  togglePublish(@Param('id', ParseIntPipe) id: number) {
    return this.milestoneService.togglePublish(id);
  }
}