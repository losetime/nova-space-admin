import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, Between } from 'typeorm';
import { PushRecord } from './entities/push-record.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { PushRecordStatus, PushSubscriptionStatus } from '../../common/enums/push.enum';
import {
  CreatePushRecordDto,
  UpdatePushRecordDto,
  QueryPushRecordDto,
  QuerySubscriptionDto,
  UpdateSubscriptionDto,
} from './dto';

@Injectable()
export class PushRecordService {
  constructor(
    @InjectRepository(PushRecord)
    private pushRecordRepository: Repository<PushRecord>,
    @InjectRepository(PushSubscription)
    private pushSubscriptionRepository: Repository<PushSubscription>,
  ) {}

  async findAll(query: QueryPushRecordDto & { email?: string }) {
    const { page = 1, limit = 10, triggerType, status, userId, email } = query;
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

    let userIds: string[] = [];
    if (email) {
      const subscriptions = await this.pushSubscriptionRepository.find({
        where: { email: Like(`%${email}%`) },
        select: ['userId'],
      });
      userIds = subscriptions.map(s => s.userId);
      
      if (userIds.length === 0) {
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }
      
      where.userId = In(userIds);
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

    if (userIds.length === 0 && !email) {
      userIds = [...new Set(records.map(r => r.userId))];
    }
    
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

  async getSubscriptions(query: QuerySubscriptionDto) {
    const { page = 1, limit = 10, status, email } = query;
    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (email) {
      where.email = Like(`%${email}%`);
    }

    const [subscriptions, total] = await this.pushSubscriptionRepository.findAndCount({
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

    return {
      data: subscriptions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateSubscription(id: string, dto: UpdateSubscriptionDto) {
    const subscription = await this.pushSubscriptionRepository.findOne({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('订阅不存在');
    }

    Object.assign(subscription, dto);
    return this.pushSubscriptionRepository.save(subscription);
  }

  async getSubscriptionStatistics() {
    const total = await this.pushSubscriptionRepository.count();
    const active = await this.pushSubscriptionRepository.count({
      where: { status: PushSubscriptionStatus.ACTIVE },
    });
    const paused = await this.pushSubscriptionRepository.count({
      where: { status: PushSubscriptionStatus.PAUSED },
    });

    return { total, active, paused };
  }
}