import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { eq, like, desc, and, sql, inArray, SQL } from "drizzle-orm";
import type { Database } from "../../database";
import { pushRecords, pushSubscriptions } from "../../database/schema/push";
import { users } from "../../database/schema/users";
import {
  CreatePushRecordDto,
  UpdatePushRecordDto,
  QueryPushRecordDto,
  QuerySubscriptionDto,
  UpdateSubscriptionDto,
} from "./dto";

@Injectable()
export class PushRecordService {
  constructor(@Inject("DATABASE") private db: Database) {}

  async findAll(query: QueryPushRecordDto & { email?: string }) {
    const { page = 1, limit = 10, triggerType, status, userId, email } = query;

    const conditions: SQL[] = [];
    if (triggerType) {
      conditions.push(eq(pushRecords.trigger_type, triggerType as any));
    }
    if (status) {
      conditions.push(eq(pushRecords.status, status as any));
    }

    let userIds: string[] = [];
    if (email) {
      const subscriptions = await this.db
        .select({ user_id: pushSubscriptions.user_id })
        .from(pushSubscriptions)
        .where(like(pushSubscriptions.email, `%${email}%`));
      userIds = subscriptions.map((s) => s.user_id);

      if (userIds.length === 0) {
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }
    }

    if (userId) {
      userIds = [userId];
    }

    if (userIds.length > 0) {
      conditions.push(inArray(pushRecords.user_id, userIds));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const records = await this.db
      .select({
        id: pushRecords.id,
        user_id: pushRecords.user_id,
        trigger_type: pushRecords.trigger_type,
        subject: pushRecords.subject,
        content: pushRecords.content,
        sent_at: pushRecords.sent_at,
        status: pushRecords.status,
        error_message: pushRecords.error_message,
        created_at: pushRecords.created_at,
      })
      .from(pushRecords)
      .where(whereClause)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(pushRecords.created_at));

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(pushRecords)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    if (records.length > 0) {
      const recordUserIds = [...new Set(records.map((r) => r.user_id))];
      const subscriptions = await this.db
        .select({
          user_id: pushSubscriptions.user_id,
          email: pushSubscriptions.email,
        })
        .from(pushSubscriptions)
        .where(inArray(pushSubscriptions.user_id, recordUserIds));

      const subscriptionMap = new Map(
        subscriptions.map((s) => [s.user_id, s.email]),
      );

      const data = records.map((record) => ({
        ...record,
        subscriptionEmail: subscriptionMap.get(record.user_id) || null,
      }));

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    return {
      data: records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const result = await this.db
      .select()
      .from(pushRecords)
      .where(eq(pushRecords.id, id))
      .limit(1);
    if (!result[0]) {
      throw new NotFoundException("推送记录不存在");
    }
    return result[0];
  }

  async create(dto: CreatePushRecordDto) {
    const result = await this.db
      .insert(pushRecords)
      .values({
        user_id: dto.userId,
        trigger_type: dto.triggerType || "manual",
        subject: dto.subject,
        content: dto.content,
        sent_at: new Date(dto.sentAt),
        status: "sent",
      } as any)
      .returning();
    return result[0];
  }

  async update(id: string, dto: UpdatePushRecordDto) {
    await this.findOne(id);
    const result = await this.db
      .update(pushRecords)
      .set({
        status: dto.status as any,
        error_message: dto.errorMessage,
      } as any)
      .where(eq(pushRecords.id, id))
      .returning();
    return result[0];
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.db.delete(pushRecords).where(eq(pushRecords.id, id));
  }

  async getStatistics() {
    const totalResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(pushRecords);
    const sentResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(pushRecords)
      .where(eq(pushRecords.status, "sent"));
    const failedResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(pushRecords)
      .where(eq(pushRecords.status, "failed"));

    return {
      total: Number(totalResult[0]?.count || 0),
      sent: Number(sentResult[0]?.count || 0),
      failed: Number(failedResult[0]?.count || 0),
    };
  }

  async getSubscriptions(query: QuerySubscriptionDto) {
    const { page = 1, limit = 10, status, email } = query;

    const conditions: SQL[] = [];
    if (status) {
      conditions.push(eq(pushSubscriptions.status, status as any));
    }
    if (email) {
      conditions.push(like(pushSubscriptions.email, `%${email}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const subscriptions = await this.db
      .select()
      .from(pushSubscriptions)
      .innerJoin(users, eq(pushSubscriptions.user_id, users.id))
      .where(whereClause)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(pushSubscriptions.created_at));

    const data = subscriptions.map((s) => ({
      ...s.push_subscriptions,
      user: {
        id: s.users.id,
        username: s.users.username,
      },
    }));

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(pushSubscriptions)
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

  async updateSubscription(id: string, dto: UpdateSubscriptionDto) {
    const existing = await this.db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.id, id))
      .limit(1);
    if (!existing[0]) {
      throw new NotFoundException("订阅不存在");
    }

    const result = await this.db
      .update(pushSubscriptions)
      .set({
        enabled: dto.enabled,
        status: dto.status as any,
      } as any)
      .where(eq(pushSubscriptions.id, id))
      .returning();
    return result[0];
  }

  async getSubscriptionStatistics() {
    const totalResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(pushSubscriptions);
    const activeResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.status, "active"));
    const pausedResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.status, "paused"));

    return {
      total: Number(totalResult[0]?.count || 0),
      active: Number(activeResult[0]?.count || 0),
      paused: Number(pausedResult[0]?.count || 0),
    };
  }
}
