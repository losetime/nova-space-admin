import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PushRecord } from './entities/push-record.entity';
import {
  CreatePushRecordDto,
  UpdatePushRecordDto,
  QueryPushRecordDto,
} from './dto';

@Injectable()
export class PushRecordService {
  constructor(
    @InjectRepository(PushRecord)
    private pushRecordRepository: Repository<PushRecord>,
  ) {}

  async findAll(query: QueryPushRecordDto) {
    const { page = 1, limit = 10, contentType, status } = query;
    const where: any = {};

    if (contentType) {
      where.contentType = contentType;
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await this.pushRecordRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
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
    const record = await this.pushRecordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('推送记录不存在');
    }
    return record;
  }

  async create(dto: CreatePushRecordDto) {
    const record = this.pushRecordRepository.create(dto);
    return this.pushRecordRepository.save(record);
  }

  async update(id: number, dto: UpdatePushRecordDto) {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    return this.pushRecordRepository.save(record);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    await this.pushRecordRepository.remove(record);
  }

  async getStatistics() {
    const total = await this.pushRecordRepository.count();
    const success = await this.pushRecordRepository.count({
      where: { status: 'success' },
    });
    const failed = await this.pushRecordRepository.count({
      where: { status: 'failed' },
    });
    const pending = await this.pushRecordRepository.count({
      where: { status: 'pending' },
    });

    return { total, success, failed, pending };
  }
}