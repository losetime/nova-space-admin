import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import axios from 'axios';
import { Client } from 'tencentcloud-sdk-nodejs-tmt/tencentcloud/services/tmt/v20180321/tmt_client';
import { Quiz } from './entities/quiz.entity';

interface OpenTDBResult {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export interface SyncConfig {
  enabled: boolean;
  cron: string;
  count: number;
}

@Injectable()
export class QuizSyncService {
  private readonly logger = new Logger(QuizSyncService.name);
  private tmtClient: Client | null = null;
  private lastSyncTime: Date | null = null;

  // 内存中的配置
  private syncConfig: SyncConfig = {
    enabled: false,
    cron: '0 3 * * *', // 默认每天凌晨3点
    count: 10,
  };

  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
  ) {
    this.initTmtClient();
  }

  private initTmtClient() {
    const secretId = process.env.TENCENT_SECRET_ID;
    const secretKey = process.env.TENCENT_SECRET_KEY;

    if (secretId && secretKey) {
      this.tmtClient = new Client({
        credential: {
          secretId,
          secretKey,
        },
        region: 'ap-beijing',
      });
      this.logger.log('腾讯翻译客户端初始化成功');
    } else {
      this.logger.warn('未配置腾讯翻译 API，翻译功能将不可用');
    }
  }

  async fetchFromOpenTDB(count: number): Promise<OpenTDBResult[]> {
    const url = `https://opentdb.com/api.php?amount=${count}&category=17&type=multiple`;
    const response = await axios.get(url);

    if (response.data.response_code !== 0) {
      throw new Error('OpenTDB API returned error');
    }

    return response.data.results || [];
  }

  async translateToChinese(text: string): Promise<string> {
    if (!text) return '';
    if (!this.tmtClient) return text; // 未配置翻译则返回原文

    try {
      const result = await this.tmtClient.TextTranslate({
        SourceText: text,
        Source: 'en',
        Target: 'zh',
        ProjectId: 0,
      });
      return result.TargetText || text;
    } catch (error) {
      this.logger.error(`翻译失败: ${text}`, error);
      return text;
    }
  }

  decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&quot;': '"',
      '&#039;': "'",
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&nbsp;': ' ',
      '&deg;': '°',
      '&eacute;': 'é',
      '&iacute;': 'í',
      '&oacute;': 'ó',
      '&aacute;': 'á',
      '&uacute;': 'ú',
    };
    return text.replace(/&[^;]+;/g, (match) => entities[match] || match);
  }

  generateSourceId(question: string, correctAnswer: string): string {
    return crypto
      .createHash('md5')
      .update(question + correctAnswer)
      .digest('hex');
  }

  shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async syncQuizzes(count = 10): Promise<{ added: number; skipped: number; errors: number }> {
    this.logger.log(`开始同步 ${count} 道题目...`);

    const rawQuizzes = await this.fetchFromOpenTDB(count);
    let added = 0;
    let skipped = 0;
    let errors = 0;

    for (const raw of rawQuizzes) {
      try {
        const question = this.decodeHtmlEntities(raw.question);
        const correctAnswer = this.decodeHtmlEntities(raw.correct_answer);
        const incorrectAnswers = raw.incorrect_answers.map((a) =>
          this.decodeHtmlEntities(a),
        );

        const sourceId = this.generateSourceId(question, correctAnswer);

        const exists = await this.quizRepository.findOne({
          where: { sourceId },
        });
        if (exists) {
          this.logger.debug(`跳过重复题目: ${question.substring(0, 30)}...`);
          skipped++;
          continue;
        }

        this.logger.debug(`翻译中: ${question.substring(0, 30)}...`);
        const translatedQuestion = await this.translateToChinese(question);
        const translatedCorrect = await this.translateToChinese(correctAnswer);
        const translatedIncorrect = await Promise.all(
          incorrectAnswers.map((a) => this.translateToChinese(a)),
        );

        const options = this.shuffleArray([
          translatedCorrect,
          ...translatedIncorrect,
        ]);
        const correctIndex = options.indexOf(translatedCorrect);

        await this.quizRepository.save({
          question: translatedQuestion,
          options,
          correctIndex,
          explanation: '',
          category: this.mapDifficultyToCategory(raw.difficulty),
          points: raw.difficulty === 'hard' ? 15 : raw.difficulty === 'medium' ? 12 : 10,
          sourceId,
          sourceType: 'opentdb',
          originalQuestion: question,
        });

        this.logger.log(`已添加: ${translatedQuestion.substring(0, 30)}...`);
        added++;

        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        this.logger.error(`处理题目失败:`, error);
        errors++;
      }
    }

    this.lastSyncTime = new Date();
    this.logger.log(`同步完成: 新增 ${added}, 跳过 ${skipped}, 错误 ${errors}`);
    return { added, skipped, errors };
  }

  private mapDifficultyToCategory(difficulty: string): string {
    switch (difficulty) {
      case 'hard':
        return 'advanced';
      case 'medium':
        return 'basic';
      default:
        return 'basic';
    }
  }

  async getStats() {
    const total = await this.quizRepository.count();
    const fromOpenTDB = await this.quizRepository.count({
      where: { sourceType: 'opentdb' },
    });
    const manual = await this.quizRepository.count({
      where: { sourceType: 'manual' },
    });
    const byCategory = await this.quizRepository
      .createQueryBuilder('quiz')
      .select('quiz.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('quiz.category')
      .getRawMany();

    return {
      total,
      fromOpenTDB,
      manual,
      byCategory,
      lastSyncTime: this.lastSyncTime,
    };
  }

  getConfig(): SyncConfig {
    return this.syncConfig;
  }

  updateConfig(config: Partial<SyncConfig>): SyncConfig {
    this.syncConfig = { ...this.syncConfig, ...config };
    this.logger.log(`更新同步配置: ${JSON.stringify(this.syncConfig)}`);
    return this.syncConfig;
  }
}