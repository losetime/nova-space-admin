import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Intelligence, IntelligenceLevel } from '../intelligence/entities/intelligence.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { SubscriptionType } from '../../common/enums/push.enum';
import { UserLevel } from '../../common/entities/user.entity';
import axios from 'axios';

interface DigestContent {
  intelligence: any[];
  spaceWeather: any | null;
  date: string;
}

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    @InjectRepository(Intelligence)
    private intelligenceRepository: Repository<Intelligence>,
    private configService: ConfigService,
  ) {}

  async generateDigestContent(subscription: PushSubscription): Promise<DigestContent> {
    const date = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const content: DigestContent = {
      intelligence: [],
      spaceWeather: null,
      date,
    };

    if (subscription.subscriptionTypes.includes(SubscriptionType.INTELLIGENCE)) {
      content.intelligence = await this.getIntelligenceContent(subscription);
    }

    if (subscription.subscriptionTypes.includes(SubscriptionType.SPACE_WEATHER)) {
      content.spaceWeather = await this.getSpaceWeatherContent();
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
      spaceWeather: null,
      date,
    };

    content.intelligence = await this.getIntelligenceContentSimple();
    content.spaceWeather = await this.getSpaceWeatherContent();

    return content;
  }

  private async getIntelligenceContent(subscription: PushSubscription): Promise<any[]> {
    try {
      const YESTERDAY = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const level = (subscription as any).user?.level || UserLevel.BASIC;
      
      let whereLevel: IntelligenceLevel | IntelligenceLevel[] = IntelligenceLevel.FREE;
      if (level === UserLevel.PROFESSIONAL) {
        whereLevel = [IntelligenceLevel.FREE, IntelligenceLevel.ADVANCED, IntelligenceLevel.PROFESSIONAL];
      } else if (level === UserLevel.ADVANCED) {
        whereLevel = [IntelligenceLevel.FREE, IntelligenceLevel.ADVANCED];
      }

      const intelligences = await this.intelligenceRepository.find({
        where: {
          level: Array.isArray(whereLevel) ? In(whereLevel) : whereLevel,
          createdAt: MoreThan(YESTERDAY),
        },
        order: { createdAt: 'DESC' },
        take: 3,
      });

      return intelligences.map(item => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        category: item.category,
        publishedAt: item.publishedAt,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch intelligence', error);
      return [];
    }
  }

  private async getIntelligenceContentSimple(): Promise<any[]> {
    try {
      const YESTERDAY = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const intelligences = await this.intelligenceRepository.find({
        where: {
          level: IntelligenceLevel.FREE,
          createdAt: MoreThan(YESTERDAY),
        },
        order: { createdAt: 'DESC' },
        take: 3,
      });

      return intelligences.map(item => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        category: item.category,
        publishedAt: item.publishedAt,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch intelligence', error);
      return [];
    }
  }

  private async getSpaceWeatherContent(): Promise<any | null> {
    try {
      const response = await axios.get('https://services.swpc.noaa.gov/json/alerts.json', {
        timeout: 5000,
      });

      const alerts = response.data
        .slice(0, 5)
        .map((item: any) => ({
          type: item.product || 'Space Weather Alert',
          time: item.issue_datetime,
          summary: (item.message || '').substring(0, 200),
        }));

      return {
        alerts,
        hasAlert: alerts.length > 0,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to fetch space weather from NOAA API', error);
      return null;
    }
  }
}