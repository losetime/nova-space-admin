import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { eq, desc, and, sql, lt, gte, asc, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as schema from '../../database/schema';
import type { Database } from '../../database';
import {
  CreatePlanDto,
  UpdatePlanDto,
  QueryPlanDto,
  CreateBenefitDto,
  UpdateBenefitDto,
  QueryBenefitDto,
  CreateLevelDto,
  UpdateLevelDto,
  QueryLevelDto,
  ConfigureLevelBenefitsDto,
  AddLevelBenefitDto,
  QuerySubscriptionDto,
  AdminActivateDto,
  AdminCancelDto,
} from './dto';

type PlanLevel = 'basic' | 'advanced' | 'professional';
type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

@Injectable()
export class MembershipService {
  constructor(@Inject('DATABASE') private db: Database) {}

  // ============ Plans ============

  async findAllPlans(query: QueryPlanDto) {
    const { isActive, level, page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (isActive !== undefined) {
      conditions.push(eq(schema.membershipPlans.isActive, isActive));
    }
    if (level) {
      conditions.push(eq(schema.membershipPlans.level, level));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await this.db
      .select()
      .from(schema.membershipPlans)
      .where(whereClause)
      .orderBy(desc(schema.membershipPlans.sortOrder), desc(schema.membershipPlans.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.membershipPlans)
      .where(whereClause);

    return {
      data,
      total: Number(count),
      page,
      limit,
      totalPages: Math.ceil(Number(count) / limit),
    };
  }

  async findPlanById(id: string) {
    const [plan] = await this.db
      .select()
      .from(schema.membershipPlans)
      .where(eq(schema.membershipPlans.id, id))
      .limit(1);
    if (!plan) {
      throw new NotFoundException('套餐不存在');
    }
    return plan;
  }

  async findPlanByCode(planCode: string) {
    const [plan] = await this.db
      .select()
      .from(schema.membershipPlans)
      .where(eq(schema.membershipPlans.planCode, planCode))
      .limit(1);
    return plan || null;
  }

  async createPlan(dto: CreatePlanDto) {
    const existing = await this.findPlanByCode(dto.planCode);
    if (existing) {
      throw new ConflictException('套餐代码已存在');
    }

    const [plan] = await this.db
      .insert(schema.membershipPlans)
      .values({
        name: dto.name,
        planCode: dto.planCode,
        durationMonths: dto.durationMonths,
        level: dto.level,
        price: dto.price.toString(),
        pointsPrice: dto.pointsPrice,
        description: dto.description,
        features: dto.features,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning();
    return plan;
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    await this.findPlanById(id);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.durationMonths) updateData.durationMonths = dto.durationMonths;
    if (dto.level) updateData.level = dto.level;
    if (dto.price !== undefined) updateData.price = dto.price.toString();
    if (dto.pointsPrice !== undefined) updateData.pointsPrice = dto.pointsPrice;
    if (dto.description) updateData.description = dto.description;
    if (dto.features) updateData.features = dto.features;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;
    updateData.updatedAt = new Date();

    const [plan] = await this.db
      .update(schema.membershipPlans)
      .set(updateData)
      .where(eq(schema.membershipPlans.id, id))
      .returning();
    return plan;
  }

  async deletePlan(id: string) {
    await this.findPlanById(id);
    await this.db
      .delete(schema.membershipPlans)
      .where(eq(schema.membershipPlans.id, id));
    return { message: '删除成功' };
  }

  // ============ Benefits (New) ============

  async findAllBenefits(query: QueryBenefitDto) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const data = await this.db
      .select()
      .from(schema.benefits)
      .orderBy(asc(schema.benefits.sortOrder), asc(schema.benefits.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.benefits);

    return {
      data,
      total: Number(count),
      page,
      limit,
    };
  }

  async findBenefitById(id: string) {
    const [benefit] = await this.db
      .select()
      .from(schema.benefits)
      .where(eq(schema.benefits.id, id))
      .limit(1);
    if (!benefit) {
      throw new NotFoundException('权益不存在');
    }
    return benefit;
  }

  async createBenefit(dto: CreateBenefitDto) {
    const [benefit] = await this.db
      .insert(schema.benefits)
      .values({
        id: randomUUID(),
        name: dto.name,
        description: dto.description,
        valueType: dto.valueType || 'number',
        unit: dto.unit,
        sortOrder: dto.sortOrder || 0,
      })
      .returning();
    return benefit;
  }

  async updateBenefit(id: string, dto: UpdateBenefitDto) {
    await this.findBenefitById(id);

    const updateData: any = { updatedAt: new Date() };
    if (dto.name) updateData.name = dto.name;
    if (dto.description) updateData.description = dto.description;
    if (dto.valueType) updateData.valueType = dto.valueType;
    if (dto.unit) updateData.unit = dto.unit;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    const [benefit] = await this.db
      .update(schema.benefits)
      .set(updateData)
      .where(eq(schema.benefits.id, id))
      .returning();
    return benefit;
  }

  async deleteBenefit(id: string) {
    await this.findBenefitById(id);
    
    await this.db
      .delete(schema.levelBenefits)
      .where(eq(schema.levelBenefits.benefitId, id));
    
    await this.db
      .delete(schema.benefits)
      .where(eq(schema.benefits.id, id));
    return { message: '删除成功' };
  }

  // ============ Member Levels (New) ============

  async findAllLevels(query: QueryLevelDto) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const levels = await this.db
      .select()
      .from(schema.memberLevels)
      .orderBy(asc(schema.memberLevels.sortOrder), asc(schema.memberLevels.createdAt))
      .limit(limit)
      .offset(offset);

    const levelsWithBenefits = await Promise.all(
      levels.map(async (level) => {
        const benefits = await this.db
          .select({
            id: schema.benefits.id,
            name: schema.benefits.name,
            description: schema.benefits.description,
            valueType: schema.benefits.valueType,
            unit: schema.benefits.unit,
            value: schema.levelBenefits.value,
            displayText: schema.levelBenefits.displayText,
          })
          .from(schema.levelBenefits)
          .innerJoin(schema.benefits, eq(schema.levelBenefits.benefitId, schema.benefits.id))
          .where(eq(schema.levelBenefits.levelId, level.id));

        const [{ userCount }] = await this.db
          .select({ userCount: sql<number>`count(*)` })
          .from(schema.users)
          .where(sql`${schema.users.level} = ${level.code}`);

        return {
          ...level,
          benefits,
          userCount: Number(userCount),
        };
      })
    );

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.memberLevels);

    return {
      data: levelsWithBenefits,
      total: Number(count),
      page,
      limit,
    };
  }

  async findLevelById(id: string) {
    const [level] = await this.db
      .select()
      .from(schema.memberLevels)
      .where(eq(schema.memberLevels.id, id))
      .limit(1);
    if (!level) {
      throw new NotFoundException('等级不存在');
    }

    const benefits = await this.db
      .select({
        id: schema.benefits.id,
        name: schema.benefits.name,
        description: schema.benefits.description,
        valueType: schema.benefits.valueType,
        unit: schema.benefits.unit,
        value: schema.levelBenefits.value,
        displayText: schema.levelBenefits.displayText,
      })
      .from(schema.levelBenefits)
      .innerJoin(schema.benefits, eq(schema.levelBenefits.benefitId, schema.benefits.id))
      .where(eq(schema.levelBenefits.levelId, id));

    const [{ userCount }] = await this.db
      .select({ userCount: sql<number>`count(*)` })
      .from(schema.users)
      .where(sql`${schema.users.level} = ${level.code}`);

    return {
      ...level,
      benefits,
      userCount: Number(userCount),
    };
  }

  async findLevelByCode(code: string) {
    const [level] = await this.db
      .select()
      .from(schema.memberLevels)
      .where(eq(schema.memberLevels.code, code))
      .limit(1);
    return level || null;
  }

  generateLevelCode(name: string): string {
    const pinyinMap: Record<string, string> = {
      '普通': 'basic',
      '高级': 'advanced',
      '专业': 'professional',
      '至尊': 'supreme',
      '钻石': 'diamond',
      '黄金': 'gold',
      '白银': 'silver',
      'VIP': 'vip',
    };
    
    for (const [key, value] of Object.entries(pinyinMap)) {
      if (name.includes(key)) {
        return value;
      }
    }
    
    const base = name
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 20);
    
    return base || 'level';
  }

  async createLevel(dto: CreateLevelDto) {
    let code = dto.code || this.generateLevelCode(dto.name);
    
    let existing = await this.findLevelByCode(code);
    let suffix = 1;
    while (existing) {
      code = `${dto.code || this.generateLevelCode(dto.name)}_${suffix}`;
      existing = await this.findLevelByCode(code);
      suffix++;
    }

    if (dto.isDefault) {
      await this.db
        .update(schema.memberLevels)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(schema.memberLevels.isDefault, true));
    }

    const [level] = await this.db
      .insert(schema.memberLevels)
      .values({
        id: randomUUID(),
        code,
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        isDefault: dto.isDefault || false,
        sortOrder: dto.sortOrder || 0,
      })
      .returning();
    return level;
  }

  async updateLevel(id: string, dto: UpdateLevelDto) {
    const level = await this.findLevelById(id);

    if (dto.code && dto.code !== level.code) {
      const existing = await this.findLevelByCode(dto.code);
      if (existing && existing.id !== id) {
        throw new ConflictException('等级编码已存在');
      }
    }

    if (dto.isDefault && !level.isDefault) {
      await this.db
        .update(schema.memberLevels)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(schema.memberLevels.isDefault, true));
    }

    const updateData: any = { updatedAt: new Date() };
    if (dto.name) updateData.name = dto.name;
    if (dto.code) updateData.code = dto.code;
    if (dto.description) updateData.description = dto.description;
    if (dto.icon) updateData.icon = dto.icon;
    if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    const [updated] = await this.db
      .update(schema.memberLevels)
      .set(updateData)
      .where(eq(schema.memberLevels.id, id))
      .returning();
    return updated;
  }

  async deleteLevel(id: string) {
    const level = await this.findLevelById(id);

    if (level.isDefault) {
      throw new BadRequestException('默认等级不能删除');
    }

    if (level.userCount > 0) {
      throw new BadRequestException(`有 ${level.userCount} 个用户使用该等级，请先将这些用户调整到其他等级后再删除`);
    }

    await this.db
      .delete(schema.levelBenefits)
      .where(eq(schema.levelBenefits.levelId, id));

    await this.db
      .delete(schema.memberLevels)
      .where(eq(schema.memberLevels.id, id));
    return { message: '删除成功' };
  }

  async configureLevelBenefits(id: string, dto: ConfigureLevelBenefitsDto) {
    await this.findLevelById(id);

    if (dto.benefits && dto.benefits.length > 0) {
      await this.db
        .delete(schema.levelBenefits)
        .where(eq(schema.levelBenefits.levelId, id));

      for (const item of dto.benefits) {
        await this.db
          .insert(schema.levelBenefits)
          .values({
            id: randomUUID(),
            levelId: id,
            benefitId: item.benefitId,
            value: item.value,
            displayText: item.displayText,
          });
      }
    }

    return this.findLevelById(id);
  }

  async addLevelBenefit(id: string, dto: AddLevelBenefitDto) {
    await this.findLevelById(id);
    await this.findBenefitById(dto.benefitId);

    const [existing] = await this.db
      .select()
      .from(schema.levelBenefits)
      .where(
        and(
          eq(schema.levelBenefits.levelId, id),
          eq(schema.levelBenefits.benefitId, dto.benefitId)
        )
      )
      .limit(1);

    if (existing) {
      await this.db
        .update(schema.levelBenefits)
        .set({
          value: dto.value,
          displayText: dto.displayText,
          updatedAt: new Date(),
        })
        .where(eq(schema.levelBenefits.id, existing.id));
    } else {
      await this.db
        .insert(schema.levelBenefits)
        .values({
          id: randomUUID(),
          levelId: id,
          benefitId: dto.benefitId,
          value: dto.value,
          displayText: dto.displayText,
        });
    }

    return this.findLevelById(id);
  }

  async removeLevelBenefit(id: string, benefitId: string) {
    await this.findLevelById(id);
    await this.findBenefitById(benefitId);

    await this.db
      .delete(schema.levelBenefits)
      .where(
        and(
          eq(schema.levelBenefits.levelId, id),
          eq(schema.levelBenefits.benefitId, benefitId)
        )
      );

    return { message: '删除成功' };
  }

  async getDefaultLevel() {
    const [level] = await this.db
      .select()
      .from(schema.memberLevels)
      .where(eq(schema.memberLevels.isDefault, true))
      .limit(1);
    return level || null;
  }

  // ============ Subscriptions (Admin) ============

  async findAllSubscriptions(query: QuerySubscriptionDto) {
    const { userId, username, status, plan, page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (userId) {
      conditions.push(eq(schema.subscriptions.userId, userId));
    }
    if (status) {
      conditions.push(eq(schema.subscriptions.status, status as SubscriptionStatus));
    }
    if (plan) {
      conditions.push(eq(schema.subscriptions.plan, plan));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let data = await this.db
      .select({
        subscription: schema.subscriptions,
        user: {
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          nickname: schema.users.nickname,
          level: schema.users.level,
        },
      })
      .from(schema.subscriptions)
      .leftJoin(schema.users, eq(schema.subscriptions.userId, schema.users.id))
      .where(whereClause)
      .orderBy(desc(schema.subscriptions.createdAt))
      .limit(limit)
      .offset(offset);

    if (username) {
      data = data.filter((row) => row.user?.username?.includes(username));
    }

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.subscriptions)
      .where(whereClause);

    return {
      data: data.map((row) => ({
        ...row.subscription,
        user: row.user,
      })),
      total: Number(count),
      page,
      limit,
      totalPages: Math.ceil(Number(count) / limit),
    };
  }

  async findSubscriptionById(id: string) {
    const [result] = await this.db
      .select({
        subscription: schema.subscriptions,
        user: schema.users,
      })
      .from(schema.subscriptions)
      .leftJoin(schema.users, eq(schema.subscriptions.userId, schema.users.id))
      .where(eq(schema.subscriptions.id, id))
      .limit(1);
    if (!result) {
      throw new NotFoundException('订阅不存在');
    }
    return {
      ...result.subscription,
      user: result.user,
    };
  }

  async adminActivate(userId: string, dto: AdminActivateDto) {
    const planConfig = await this.findPlanByCode(dto.plan);
    if (!planConfig) {
      throw new NotFoundException('套餐配置不存在');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = dto.endDate ? new Date(dto.endDate) : this.calculateEndDate(startDate, planConfig.durationMonths);

    const [subscription] = await this.db
      .insert(schema.subscriptions)
      .values({
        userId,
        plan: dto.plan,
        status: 'active',
        price: '0',
        startDate,
        endDate,
        paymentMethod: 'admin',
        paymentId: `admin_${new Date().toISOString()}`,
      })
      .returning();

    await this.db
      .update(schema.users)
      .set({
        level: planConfig.level,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId));

    return subscription;
  }

  async adminExtend(subscriptionId: string, months: number, reason?: string) {
    const subscription = await this.findSubscriptionById(subscriptionId);

    const newEndDate = new Date(subscription.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + months);

    const [updated] = await this.db
      .update(schema.subscriptions)
      .set({
        endDate: newEndDate,
        updatedAt: new Date(),
      })
      .where(eq(schema.subscriptions.id, subscriptionId))
      .returning();

    return updated;
  }

  async adminCancel(subscriptionId: string, dto: AdminCancelDto) {
    const subscription = await this.findSubscriptionById(subscriptionId);

    const [updated] = await this.db
      .update(schema.subscriptions)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: dto.reason || '管理员取消',
        updatedAt: new Date(),
      })
      .where(eq(schema.subscriptions.id, subscriptionId))
      .returning();

    const defaultLevel = await this.getDefaultLevel();
    await this.db
      .update(schema.users)
      .set({
        level: (defaultLevel?.code || 'basic') as any,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, subscription.userId));

    return updated;
  }

  // ============ Statistics ============

  async getStatistics() {
    const [{ total }] = await this.db
      .select({ total: sql<number>`count(*)` })
      .from(schema.subscriptions);

    const [{ active }] = await this.db
      .select({ active: sql<number>`count(*)` })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.status, 'active'));

    const [{ expired }] = await this.db
      .select({ expired: sql<number>`count(*)` })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.status, 'expired'));

    const planStats = await this.db
      .select({
        plan: schema.subscriptions.plan,
        count: sql<number>`count(*)`,
      })
      .from(schema.subscriptions)
      .groupBy(schema.subscriptions.plan);

    const levelStats = await this.db
      .select({
        level: schema.users.level,
        count: sql<number>`count(*)`,
      })
      .from(schema.users)
      .groupBy(schema.users.level);

    return {
      total: Number(total),
      active: Number(active),
      expired: Number(expired),
      planStats: planStats.map((p) => ({ plan: p.plan, count: Number(p.count) })),
      levelStats: levelStats.map((l) => ({ level: l.level, count: Number(l.count) })),
    };
  }

  // ============ Helper ============

  private calculateEndDate(startDate: Date, months: number): Date {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    return endDate;
  }
}