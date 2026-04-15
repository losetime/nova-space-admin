import { Injectable, Logger, NotFoundException, Inject } from "@nestjs/common";
import { eq, like, desc, and, sql, SQL } from "drizzle-orm";
import type { Database } from "../../database";
import { quizzes } from "../../database/schema/quizzes";
import { QueryQuizDto, UpdateQuizDto, CreateQuizDto } from "./dto/quiz.dto";

type QuizCategoryType = "basic" | "advanced" | "mission" | "people";

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(@Inject("DATABASE") private db: Database) {}

  async findAll(query: QueryQuizDto) {
    const { page = 1, limit = 10, category, keyword } = query;

    const conditions: SQL[] = [];
    if (category) {
      conditions.push(eq(quizzes.category, category as QuizCategoryType));
    }
    if (keyword) {
      conditions.push(like(quizzes.question, `%${keyword}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await this.db
      .select()
      .from(quizzes)
      .where(whereClause)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(quizzes.created_at));

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(quizzes)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const quiz = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, id))
      .limit(1);
    if (!quiz[0]) {
      throw new NotFoundException("题目不存在");
    }
    return quiz[0];
  }

  private mapDtoToSchema(dto: CreateQuizDto | UpdateQuizDto) {
    return {
      question: dto.question,
      options: dto.options,
      correct_index: dto.correctIndex,
      explanation: dto.explanation,
      category: dto.category as QuizCategoryType,
      points: dto.points,
    };
  }

  async create(dto: CreateQuizDto) {
    const values = this.mapDtoToSchema(dto);
    const result = await this.db
      .insert(quizzes)
      .values(values as any)
      .returning();
    this.logger.log(`创建题目: ${result[0].id}`);
    return result[0];
  }

  async update(id: number, dto: UpdateQuizDto) {
    await this.findOne(id);
    const values = this.mapDtoToSchema(dto);
    const result = await this.db
      .update(quizzes)
      .set(values as any)
      .where(eq(quizzes.id, id))
      .returning();
    return result[0];
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.delete(quizzes).where(eq(quizzes.id, id));
    this.logger.log(`删除题目: ${id}`);
    return { message: "删除成功" };
  }

  async getStats() {
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(quizzes);
    const total = Number(countResult[0]?.count || 0);

    const byCategory = await this.db
      .select({
        category: quizzes.category,
        count: sql<number>`count(*)`,
      })
      .from(quizzes)
      .groupBy(quizzes.category);

    return {
      total,
      byCategory,
    };
  }
}
