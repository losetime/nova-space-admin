import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PushRecord } from './entities/push-record.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { PushRecordStatus } from '../../common/enums/push.enum';
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
    @InjectRepository(PushSubscription)
    private pushSubscriptionRepository: Repository<PushSubscription>,
  ) {}

  async findAll(query: QueryPushRecordDto) {
    const { page = 1, limit = 10, triggerType, status, userId } = query;
    const where: any = {};

    if (triggerType) {
      where.triggerType = triggerType;
    }
    if (status) {
      where.status = status;
    }
    if (userId) {
      where.userId = userId;
    }

    const [records, total] = await this.pushRecordRepository.findAndCount({
      where,
      relations: ['user'],
      select: {
        user: {
          id: true,
          username: true,
        },
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 批量获取订阅邮箱
    const userIds = [...new Set(records.map(r => r.userId))];
    const subscriptions = userIds.length > 0
      ? await this.pushSubscriptionRepository.find({
          where: { userId: In(userIds) },
          select: ['userId', 'email'],
        })
      : [];

    const subscriptionMap = new Map(subscriptions.map(s => [s.userId, s.email]));

    const data = records.map(record => ({
      ...record,
      subscriptionEmail: subscriptionMap.get(record.userId) || null,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
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

  async update(id: string, dto: UpdatePushRecordDto) {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    return this.pushRecordRepository.save(record);
  }

  async remove(id: string) {
    const record = await this.findOne(id);
    await this.pushRecordRepository.remove(record);
  }

  async getStatistics() {
    const total = await this.pushRecordRepository.count();
    const sent = await this.pushRecordRepository.count({
      where: { status: PushRecordStatus.SENT },
    });
    const failed = await this.pushRecordRepository.count({
      where: { status: PushRecordStatus.FAILED },
    });

    return { total, sent, failed };
  }
}