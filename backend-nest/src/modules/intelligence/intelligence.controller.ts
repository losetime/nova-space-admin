import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';
import {
  CreateIntelligenceDto,
  UpdateIntelligenceDto,
  QueryIntelligenceDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('intelligence')
@UseGuards(JwtAuthGuard, AdminGuard)
export class IntelligenceController {
  constructor(private intelligenceService: IntelligenceService) {}

  @Get()
  findAll(@Query() query: QueryIntelligenceDto) {
    return this.intelligenceService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.intelligenceService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateIntelligenceDto) {
    return this.intelligenceService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIntelligenceDto,
  ) {
    return this.intelligenceService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.intelligenceService.remove(id);
  }
}