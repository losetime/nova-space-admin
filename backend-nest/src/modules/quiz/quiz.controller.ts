import { Controller, Post, Get, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QueryQuizDto, CreateQuizDto, UpdateQuizDto } from './dto/quiz.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('quiz')
@UseGuards(JwtAuthGuard, AdminGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  async findAll(@Query() query: QueryQuizDto) {
    return this.quizService.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return this.quizService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quizService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateQuizDto) {
    return this.quizService.create(dto);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateQuizDto) {
    return this.quizService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.quizService.remove(id);
  }
}