import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from "@nestjs/common";
import { eq, ilike, desc, and, sql, SQL, gte } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import type { Database } from "../../database";
import { users } from "../../database/schema/users";
import { subscriptions } from "../../database/schema/subscriptions";
import { memberLevels } from "../../database/schema/member-levels";
import { membershipPlans } from "../../database/schema/membership-plans";
import { CreateUserDto, UpdateUserDto, QueryUserDto } from "./dto";

type UserRoleType = "user" | "admin" | "super_admin";
export interface Operator {
  id: string;
  role: string;
}

@Injectable()
export class UserService {
  constructor(@Inject("DATABASE") private db: Database) {}

  async findAll(query: QueryUserDto) {
    const { page = 1, limit = 10, keyword, role, isActive } = query;

    const conditions: SQL[] = [];
    if (keyword) {
      conditions.push(ilike(users.email, `%${keyword}%`));
    }
    if (role) {
      conditions.push(eq(users.role, role as UserRoleType));
    }
    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        phone: users.phone,
        nickname: users.nickname,
        avatar: users.avatar,
        role: users.role,
        level: users.level,
        levelName: memberLevels.name,
        points: users.points,
        totalPoints: users.totalPoints,
        isVerified: users.isVerified,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(memberLevels, eq(users.level, memberLevels.code))
      .where(whereClause)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(users.createdAt));

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
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
    const result = await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        phone: users.phone,
        nickname: users.nickname,
        avatar: users.avatar,
        role: users.role,
        level: users.level,
        levelName: memberLevels.name,
        points: users.points,
        totalPoints: users.totalPoints,
        isVerified: users.isVerified,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(memberLevels, eq(users.level, memberLevels.code))
      .where(eq(users.id, id))
      .limit(1);
    if (!result[0]) {
      throw new NotFoundException("用户不存在");
    }

    const [subscription] = await this.db
      .select({
        id: subscriptions.id,
        plan: subscriptions.plan,
        planName: membershipPlans.name,
        status: subscriptions.status,
        price: subscriptions.price,
        currency: subscriptions.currency,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        autoRenew: subscriptions.autoRenew,
      })
      .from(subscriptions)
      .leftJoin(
        membershipPlans,
        sql`${membershipPlans.planCode} = cast(${subscriptions.plan} as text)`,
      )
      .where(eq(subscriptions.userId, id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    return {
      ...result[0],
      subscription: subscription ?? null,
    };
  }

  async create(dto: CreateUserDto, operator: Operator) {
    if (dto.role === "super_admin") {
      throw new ForbiddenException("无法创建超级管理员账号");
    }

    if (operator.role !== "super_admin" && dto.role && dto.role !== "user") {
      throw new ForbiddenException("只有超级管理员可以创建管理员账号");
    }

    if (dto.email) {
      const existingEmail = await this.db
        .select()
        .from(users)
        .where(eq(users.email, dto.email))
        .limit(1);
      if (existingEmail[0]) {
        throw new ConflictException("邮箱已被使用");
      }
    }

    if (dto.phone) {
      const existingPhone = await this.db
        .select()
        .from(users)
        .where(eq(users.phone, dto.phone))
        .limit(1);
      if (existingPhone[0]) {
        throw new ConflictException("手机号已被使用");
      }
    }

    const username = await this.generateUsername(dto.email);
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const result = await this.db
      .insert(users)
      .values({
        username,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        nickname: dto.nickname || username,
        role: (dto.role ?? "user") as UserRoleType,
        level: dto.level ?? "basic",
        isActive: dto.isActive ?? true,
      } as any)
      .returning();
    return result[0];
  }

  private async generateUsername(email: string): Promise<string> {
    const local = (email.split("@")[0] || "").split(".")[0];
    const base = (local || "").slice(0, 30) || "user";
    let candidate = base;
    let n = 1;
    for (;;) {
      const [existing] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, candidate));
      if (!existing) return candidate;
      candidate = `${base}${n++}`;
    }
  }

  async update(id: string, dto: UpdateUserDto, operator: Operator) {
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    const user = existing[0];
    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    this.assertCanManageTarget(user, operator);

    if (dto.role === "super_admin") {
      throw new ForbiddenException("无法将角色设置为超级管理员");
    }

    if (operator.role !== "super_admin" && dto.role && dto.role !== "user") {
      throw new ForbiddenException("只有超级管理员可以设置管理员角色");
    }

    const result = await this.db
      .update(users)
      .set({
        role: dto.role as UserRoleType,
        isActive: dto.isActive,
      } as any)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async softDelete(id: string, operator: Operator) {
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!existing[0]) {
      throw new NotFoundException("用户不存在");
    }

    this.assertCanManageTarget(existing[0], operator);

    await this.db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, id));
    return { message: "删除成功" };
  }

  async resetPassword(
    id: string,
    operator: Operator,
    newPassword?: string,
  ) {
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!existing[0]) {
      throw new NotFoundException("用户不存在");
    }

    this.assertCanManageTarget(existing[0], operator);

    const password = newPassword || this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id));

    return { message: "密码重置成功", password };
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const now = new Date();
    const [sub] = await this.db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active"),
          gte(subscriptions.endDate, now),
        ),
      )
      .limit(1);
    return !!sub;
  }

  async canHardDelete(
    userId: string,
  ): Promise<{ canDelete: boolean; reason?: string }> {
    const user = await this.findOne(userId);

    if (user.level !== "basic") {
      return {
        canDelete: false,
        reason: "该用户为付费会员，无法删除",
      };
    }

    const hasActive = await this.hasActiveSubscription(userId);
    if (hasActive) {
      return {
        canDelete: false,
        reason: "该用户有有效订阅，无法删除",
      };
    }

    return { canDelete: true };
  }

  async hardDelete(
    userId: string,
    operator: Operator,
  ): Promise<{ message: string }> {
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!existing[0]) {
      throw new NotFoundException("用户不存在");
    }

    this.assertCanManageTarget(existing[0], operator);

    const canDelete = await this.canHardDelete(userId);
    if (!canDelete.canDelete) {
      throw new BadRequestException(canDelete.reason);
    }

    await this.db.delete(users).where(eq(users.id, userId));
    return { message: "用户已彻底删除" };
  }

  private assertCanManageTarget(
    target: { role: string },
    operator: Operator,
  ): void {
    if (target.role === "super_admin") {
      throw new ForbiddenException("超级管理员账号受保护，无法操作");
    }

    if (operator.role === "admin" && target.role !== "user") {
      throw new ForbiddenException("普通管理员不能操作管理员账号");
    }
  }

  private generateRandomPassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
