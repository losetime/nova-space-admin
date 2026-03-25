import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Intelligence, IntelligenceLevel } from '../intelligence/entities/intelligence.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { SubscriptionType } from '../../common/enums/push.enum';

interface DigestContent {
  intelligence: any[];
  date: string;
}

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    @InjectRepository(Intelligence)
    private intelligenceRepository: Repository<Intelligence>,
  ) {}

  async generateDigestContent(subscription: PushSubscription): Promise<DigestContent> {
    const date = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const content: DigestContent = {
      intelligence: [],
      date,
    };

    // 获取航天情报
    if (subscription.subscriptionTypes.includes(SubscriptionType.INTELLIGENCE)) {
      try {
        const intelligences = await this.intelligenceRepository.find({
          where: { level: IntelligenceLevel.FREE },
          order: { createdAt: 'DESC' },
          take: 5,
        });

        content.intelligence = intelligences.map((item) => ({
          id: item.id,
          title: item.title,
          summary: item.summary,
          category: item.category,
          publishedAt: item.publishedAt,
        }));
      } catch (error) {
        this.logger.error('Failed to fetch intelligence', error);
      }
    }

    return content;
  }

  async generateSimpleDigest(): Promise<DigestContent> {
    const date = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const content: DigestContent = {
      intelligence: [],
      date,
    };

    try {
      const intelligences = await this.intelligenceRepository.find({
        where: { level: IntelligenceLevel.FREE },
        order: { createdAt: 'DESC' },
        take: 5,
      });

      content.intelligence = intelligences.map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        category: item.category,
        publishedAt: item.publishedAt,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch intelligence', error);
    }

    return content;
  }
}