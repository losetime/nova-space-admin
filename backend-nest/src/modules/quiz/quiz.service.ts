import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Quiz } from './entities/quiz.entity';
import { QueryQuizDto, UpdateQuizDto, CreateQuizDto } from './dto/quiz.dto';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
  ) {}

  // ========== 问答管理方法 ==========

  async findAll(query: QueryQuizDto) {
    const { page = 1, limit = 10, category, keyword } = query;

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (keyword) {
      where.question = Like(`%${keyword}%`);
    }

    const [data, total] = await this.quizRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const quiz = await this.quizRepository.findOne({ where: { id } });
    if (!quiz) {
      throw new NotFoundException('题目不存在');
    }
    return quiz;
  }

  async create(dto: CreateQuizDto) {
    const quiz = this.quizRepository.create(dto);
    const saved = await this.quizRepository.save(quiz);
    this.logger.log(`创建题目: ${saved.id}`);
    return saved;
  }

  async update(id: number, dto: UpdateQuizDto) {
    const quiz = await this.findOne(id);
    Object.assign(quiz, dto);
    return this.quizRepository.save(quiz);
  }

  async remove(id: number) {
    const quiz = await this.findOne(id);
    await this.quizRepository.remove(quiz);
    this.logger.log(`删除题目: ${id}`);
    return { message: '删除成功' };
  }

  async getStats() {
    const total = await this.quizRepository.count();
    const byCategory = await this.quizRepository
      .createQueryBuilder('quiz')
      .select('quiz.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('quiz.category')
      .getRawMany();

    return {
      total,
      byCategory,
    };
  }
}