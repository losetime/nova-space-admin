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

function parseSubscriptionTypes(types: string | null): string[] {
  if (!types) return [];
  try {
    const parsed = JSON.parse(types);
    if (Array.isArray(parsed)) return parsed;
    return types.split(",").filter(Boolean);
  } catch {
    return types.split(",").filter(Boolean);
  }
}

@Injectable()
export class PushRecordService {
  constructor(@Inject("DATABASE") private db: Database) {}

  async findAll(query: QueryPushRecordDto & { email?: string }) {
    const { page = 1, limit = 10, triggerType, status, userId, email } = query;

    const conditions: SQL[] = [];
    if (triggerType) {
      conditions.push(eq(pushRecords.triggerType, triggerType as any));
    }
    if (status) {
      conditions.push(eq(pushRecords.status, status as any));
    }

    let userIds: string[] = [];
    if (email) {
      const subscriptions = await this.db
        .select({ userId: pushSubscriptions.userId })
        .from(pushSubscriptions)
        .where(like(pushSubscriptions.email, `%${email}%`));
      userIds = subscriptions.map((s) => s.userId);

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
      conditions.push(inArray(pushRecords.userId, userIds));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const records = await this.db
      .select({
        id: pushRecords.id,
        userId: pushRecords.userId,
        triggerType: pushRecords.triggerType,
        subject: pushRecords.subject,
        content: pushRecords.content,
        sentAt: pushRecords.sentAt,
        status: pushRecords.status,
        errorMessage: pushRecords.errorMessage,
        createdAt: pushRecords.createdAt,
      })
      .from(pushRecords)
      .where(whereClause)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(pushRecords.createdAt));

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(pushRecords)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    if (records.length > 0) {
      const recordUserIds = [...new Set(records.map((r) => r.userId))];
      const subscriptions = await this.db
        .select({
          userId: pushSubscriptions.userId,
          email: pushSubscriptions.email,
        })
        .from(pushSubscriptions)
        .where(inArray(pushSubscriptions.userId, recordUserIds));

      const subscriptionMap = new Map(
        subscriptions.map((s) => [s.userId, s.email]),
      );

      const data = records.map((record) => ({
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
        userId: dto.userId,
        triggerType: dto.triggerType || "manual",
        subject: dto.subject,
        content: dto.content,
        sentAt: new Date(dto.sentAt),
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
        errorMessage: dto.errorMessage,
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
      .innerJoin(users, eq(pushSubscriptions.userId, users.id))
      .where(whereClause)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(pushSubscriptions.createdAt));

    const data = subscriptions.map((s) => ({
      ...s.push_subscriptions,
      subscriptionTypes: parseSubscriptionTypes(
        s.push_subscriptions.subscriptionTypes,
      ),
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
