# 每日问答同步功能实现方案

## 概述

为 nova-space 用户端的每日问答模块提供题目同步功能，从 OpenTDB 获取科学类题目并翻译为中文。

---

## 一、数据源

### OpenTDB (Open Trivia Database)

- **URL:** `https://opentdb.com/api.php`
- **优点:** 完全免费，无需 API Key，无调用限制
- **科学类别:** Category 17 (Science & Nature)

**调用示例：**
```bash
GET https://opentdb.com/api.php?amount=10&category=17&type=multiple
```

**响应格式：**
```json
{
  "response_code": 0,
  "results": [
    {
      "category": "Science & Nature",
      "type": "multiple",
      "difficulty": "easy",
      "question": "What planet is known as the Red Planet?",
      "correct_answer": "Mars",
      "incorrect_answers": ["Venus", "Jupiter", "Saturn"]
    }
  ]
}
```

**注意：**
- 题目是 HTML 编码的（如 `&quot;` `&#039;`），需要解码
- 没有唯一 ID，需要自己生成

---

## 二、翻译服务

### 腾讯翻译 API

- **免费额度:** 500万字符/月
- **超出价格:** ~50元/百万字符
- **申请地址:** https://cloud.tencent.com/product/tmt

**配置：**
```env
TENCENT_SECRET_ID=你的SecretId
TENCENT_SECRET_KEY=你的SecretKey
```

**SDK 调用示例：**
```typescript
import tmt from 'tencentcloud-sdk-nodejs-tmt';

const client = new tmt.v20180321.Client({
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
  },
  region: 'ap-beijing',
});

async function translate(text: string): Promise<string> {
  const result = await client.TextTranslate({
    SourceText: text,
    Source: 'en',
    Target: 'zh',
    ProjectId: 0,
  });
  return result.TargetText;
}
```

---

## 三、数据库修改

### 3.1 新增字段

连接 nova-space 的 PostgreSQL 数据库，执行：

```sql
ALTER TABLE education_quizzes
  ADD COLUMN source_id VARCHAR(64) UNIQUE,
  ADD COLUMN source_type VARCHAR(32),
  ADD COLUMN original_question TEXT;
```

### 3.2 实体定义（参考）

如果管理端也使用 TypeORM，实体定义如下：

```typescript
@Entity('education_quizzes')
export class Quiz {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'json' })
  options: string[];

  @Column()
  correctIndex: number;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ type: 'enum', enum: ['basic', 'advanced', 'mission', 'people'], default: 'basic' })
  category: string;

  @Column({ default: 10 })
  points: number;

  @Column({ nullable: true, unique: true })
  sourceId: string;  // MD5(question + correctAnswer) 用于去重

  @Column({ nullable: true })
  sourceType: string; // 'opentdb' | 'manual'

  @Column({ type: 'text', nullable: true })
  originalQuestion: string; // 原始英文题目

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## 四、同步服务实现

### 4.1 完整代码

```typescript
// quiz-sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import axios from 'axios';
import tmt from 'tencentcloud-sdk-nodejs-tmt';
import { Quiz } from './entities/quiz.entity';

interface OpenTDBResult {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

@Injectable()
export class QuizSyncService {
  private readonly logger = new Logger(QuizSyncService.name);
  private readonly tmtClient: tmt.v20180321.Client;

  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
  ) {
    this.tmtClient = new tmt.v20180321.Client({
      credential: {
        secretId: process.env.TENCENT_SECRET_ID || '',
        secretKey: process.env.TENCENT_SECRET_KEY || '',
      },
      region: 'ap-beijing',
    });
  }

  /**
   * 从 OpenTDB 获取题目
   */
  async fetchFromOpenTDB(count: number): Promise<OpenTDBResult[]> {
    const url = `https://opentdb.com/api.php?amount=${count}&category=17&type=multiple`;
    const response = await axios.get(url);

    if (response.data.response_code !== 0) {
      throw new Error('OpenTDB API returned error');
    }

    return response.data.results || [];
  }

  /**
   * 腾讯翻译
   */
  async translateToChinese(text: string): Promise<string> {
    if (!text) return '';

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
      return text; // 翻译失败返回原文
    }
  }

  /**
   * HTML 实体解码
   */
  decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&quot;': '"',
      '&#039;': "'",
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&nbsp;': ' ',
      '&deg;': '°',
    };
    return text.replace(/&[^;]+;/g, (match) => entities[match] || match);
  }

  /**
   * 生成唯一 ID（用于去重）
   */
  generateSourceId(question: string, correctAnswer: string): string {
    return crypto
      .createHash('md5')
      .update(question + correctAnswer)
      .digest('hex');
  }

  /**
   * 打乱数组
   */
  shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * 主同步方法
   */
  async syncQuizzes(count = 10): Promise<{ added: number; skipped: number; errors: number }> {
    this.logger.log(`开始同步 ${count} 道题目...`);

    const rawQuizzes = await this.fetchFromOpenTDB(count);
    let added = 0;
    let skipped = 0;
    let errors = 0;

    for (const raw of rawQuizzes) {
      try {
        // 解码 HTML 实体
        const question = this.decodeHtmlEntities(raw.question);
        const correctAnswer = this.decodeHtmlEntities(raw.correct_answer);
        const incorrectAnswers = raw.incorrect_answers.map((a) =>
          this.decodeHtmlEntities(a),
        );

        // 生成唯一标识
        const sourceId = this.generateSourceId(question, correctAnswer);

        // 检查是否已存在
        const exists = await this.quizRepository.findOne({
          where: { sourceId },
        });
        if (exists) {
          this.logger.debug(`跳过重复题目: ${question.substring(0, 30)}...`);
          skipped++;
          continue;
        }

        // 翻译
        this.logger.debug(`翻译中: ${question.substring(0, 30)}...`);
        const translatedQuestion = await this.translateToChinese(question);
        const translatedCorrect = await this.translateToChinese(correctAnswer);
        const translatedIncorrect = await Promise.all(
          incorrectAnswers.map((a) => this.translateToChinese(a)),
        );

        // 组合选项并打乱
        const options = this.shuffleArray([
          translatedCorrect,
          ...translatedIncorrect,
        ]);
        const correctIndex = options.indexOf(translatedCorrect);

        // 保存到数据库
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

        // 避免 API 限流，加延迟
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        this.logger.error(`处理题目失败:`, error);
        errors++;
      }
    }

    this.logger.log(`同步完成: 新增 ${added}, 跳过 ${skipped}, 错误 ${errors}`);
    return { added, skipped, errors };
  }

  /**
   * 难度映射到分类
   */
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

  /**
   * 获取统计信息
   */
  async getStats() {
    const total = await this.quizRepository.count();
    const fromOpenTDB = await this.quizRepository.count({
      where: { sourceType: 'opentdb' },
    });
    const manual = await this.quizRepository.count({
      where: { sourceType: 'manual' },
    });

    return {
      total,
      fromOpenTDB,
      manual,
      lastSync: new Date(), // 可以从日志或其他地方获取
    };
  }
}
```

### 4.2 控制器

```typescript
// quiz-sync.controller.ts
import { Controller, Post, Get, Body } from '@nestjs/common';
import { QuizSyncService } from './quiz-sync.service';

@Controller('admin/quiz')
export class QuizSyncController {
  constructor(private readonly quizSyncService: QuizSyncService) {}

  @Post('sync')
  async syncQuizzes(@Body() body: { count?: number }) {
    return this.quizSyncService.syncQuizzes(body.count || 10);
  }

  @Get('stats')
  async getStats() {
    return this.quizSyncService.getStats();
  }
}
```

### 4.3 模块注册

```typescript
// quiz-sync.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quiz } from './entities/quiz.entity';
import { QuizSyncService } from './quiz-sync.service';
import { QuizSyncController } from './quiz-sync.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Quiz])],
  controllers: [QuizSyncController],
  providers: [QuizSyncService],
  exports: [QuizSyncService],
})
export class QuizSyncModule {}
```

---

## 五、定时任务（可选）

```typescript
// quiz-sync.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { QuizSyncService } from './quiz-sync.service';

@Injectable()
export class QuizSyncScheduler {
  private readonly logger = new Logger(QuizSyncScheduler.name);

  constructor(private readonly quizSyncService: QuizSyncService) {}

  // 每天凌晨 3 点执行
  @Cron('0 3 * * *')
  async handleDailySync() {
    this.logger.log('开始定时同步题目...');
    await this.quizSyncService.syncQuizzes(10);
  }
}
```

---

## 六、环境变量

在管理系统的 `.env` 文件中添加：

```env
# 腾讯翻译 API
TENCENT_SECRET_ID=你的SecretId
TENCENT_SECRET_KEY=你的SecretKey

# 同步配置
QUIZ_SYNC_COUNT=10
```

---

## 七、依赖安装

```bash
# 安装腾讯云 SDK
pnpm add tencentcloud-sdk-nodejs-tmt

# 如果没有 axios
pnpm add axios
```

---

## 八、测试验证

### 8.1 手动触发同步

```bash
curl -X POST http://localhost:3000/admin/quiz/sync \
  -H "Content-Type: application/json" \
  -d '{"count": 10}'
```

### 8.2 查看统计

```bash
curl http://localhost:3000/admin/quiz/stats
```

### 8.3 验证数据库

```sql
SELECT id, question, source_type, original_question
FROM education_quizzes
WHERE source_type = 'opentdb'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 九、注意事项

1. **API 限流：** OpenTDB 没有明确限流，但建议每次同步加 200ms 延迟
2. **翻译质量：** 机器翻译可能不完美，建议定期人工审核
3. **去重策略：** 使用 MD5(question + correctAnswer) 作为唯一标识
4. **字符编码：** OpenTDB 返回的是 HTML 编码，需要解码后再翻译