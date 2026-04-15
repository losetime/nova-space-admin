import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { eq, desc, and, sql } from "drizzle-orm";
import type { Database } from "../../database";
import { feedbacks } from "../../database/schema/feedbacks";
import { QueryFeedbackDto, UpdateFeedbackDto } from "./dto";

@Injectable()
export class FeedbackService {
  constructor(@Inject("DATABASE") private db: Database) {}

  async findAll(query: QueryFeedbackDto) {
    const { page = 1, limit = 10, type, status } = query;

    const conditions = [];
    if (type) {
      conditions.push(eq(feedbacks.type, type));
    }
    if (status) {
      conditions.push(eq(feedbacks.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await this.db
      .select()
      .from(feedbacks)
      .where(whereClause)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(feedbacks.createdAt));

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(feedbacks)
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

  async findOne(id: string) {
    const feedback = await this.db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.id, id))
      .limit(1);
    if (!feedback[0]) {
      throw new NotFoundException("反馈不存在");
    }
    return feedback[0];
  }

  async update(id: string, dto: UpdateFeedbackDto) {
    await this.findOne(id);
    const result = await this.db
      .update(feedbacks)
      .set(dto)
      .where(eq(feedbacks.id, id))
      .returning();
    return result[0];
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.db.delete(feedbacks).where(eq(feedbacks.id, id));
    return { message: "删除成功" };
  }
}
