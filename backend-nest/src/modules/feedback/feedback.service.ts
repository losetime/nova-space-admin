import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { QueryFeedbackDto, UpdateFeedbackDto } from './dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
  ) {}

  async findAll(query: QueryFeedbackDto) {
    const { page = 1, limit = 10, type, status } = query;

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await this.feedbackRepository.findAndCount({
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

  async findOne(id: string) {
    const feedback = await this.feedbackRepository.findOne({ where: { id } });
    if (!feedback) {
      throw new NotFoundException('反馈不存在');
    }
    return feedback;
  }

  async update(id: string, dto: UpdateFeedbackDto) {
    const feedback = await this.findOne(id);
    Object.assign(feedback, dto);
    return this.feedbackRepository.save(feedback);
  }

  async remove(id: string) {
    const feedback = await this.findOne(id);
    await this.feedbackRepository.remove(feedback);
    return { message: '删除成功' };
  }
}