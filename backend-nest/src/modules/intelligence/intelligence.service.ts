import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Intelligence } from './entities/intelligence.entity';
import {
  CreateIntelligenceDto,
  UpdateIntelligenceDto,
  QueryIntelligenceDto,
} from './dto';

@Injectable()
export class IntelligenceService {
  constructor(
    @InjectRepository(Intelligence)
    private intelligenceRepository: Repository<Intelligence>,
  ) {}

  async findAll(query: QueryIntelligenceDto) {
    const { page = 1, limit = 10, category, level, keyword } = query;

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (level) {
      where.level = level;
    }
    if (keyword) {
      where.title = Like(`%${keyword}%`);
    }

    const [data, total] = await this.intelligenceRepository.findAndCount({
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
    const intelligence = await this.intelligenceRepository.findOne({
      where: { id },
    });
    if (!intelligence) {
      throw new NotFoundException('情报不存在');
    }
    return intelligence;
  }

  async create(dto: CreateIntelligenceDto) {
    const intelligence = this.intelligenceRepository.create(dto);
    return this.intelligenceRepository.save(intelligence);
  }

  async update(id: number, dto: UpdateIntelligenceDto) {
    const intelligence = await this.findOne(id);
    Object.assign(intelligence, dto);
    return this.intelligenceRepository.save(intelligence);
  }

  async remove(id: number) {
    const intelligence = await this.findOne(id);
    await this.intelligenceRepository.remove(intelligence);
    return { message: '删除成功' };
  }

  async batchCreate(intelligences: Partial<Intelligence>[]) {
    const created = this.intelligenceRepository.create(intelligences);
    return this.intelligenceRepository.save(created);
  }
}