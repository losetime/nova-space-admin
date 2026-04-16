import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from "@nestjs/common";
import { eq, like, desc, and, sql, SQL } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import type { Database } from "../../database";
import { users } from "../../database/schema/users";
import { CreateUserDto, UpdateUserDto, QueryUserDto } from "./dto";

type UserRoleType = "user" | "admin" | "super_admin";
type UserLevelType = "basic" | "advanced" | "professional";

@Injectable()
export class UserService {
  constructor(@Inject("DATABASE") private db: Database) {}

  async findAll(query: QueryUserDto) {
    const { page = 1, limit = 10, keyword, role, isActive } = query;

    const conditions: SQL[] = [];
    if (keyword) {
      conditions.push(like(users.username, `%${keyword}%`));
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
        points: users.points,
        totalPoints: users.totalPoints,
        isVerified: users.isVerified,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
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
        points: users.points,
        totalPoints: users.totalPoints,
        isVerified: users.isVerified,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!result[0]) {
      throw new NotFoundException("用户不存在");
    }
    return result[0];
  }

  async create(dto: CreateUserDto) {
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.username, dto.username))
      .limit(1);
    if (existingUser[0]) {
      throw new ConflictException("用户名已存在");
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

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const result = await this.db
      .insert(users)
      .values({
        username: dto.username,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        nickname: dto.nickname,
        avatar: dto.avatar,
        role: dto.role as UserRoleType,
        level: dto.level as UserLevelType,
      } as any)
      .returning();
    return result[0];
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    const user = existing[0];
    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    if (dto.username && dto.username !== user.username) {
      const existingUser = await this.db
        .select()
        .from(users)
        .where(eq(users.username, dto.username))
        .limit(1);
      if (existingUser[0]) {
        throw new ConflictException("用户名已存在");
      }
    }

    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.db
        .select()
        .from(users)
        .where(eq(users.email, dto.email))
        .limit(1);
      if (existingEmail[0]) {
        throw new ConflictException("邮箱已被使用");
      }
    }

    if (dto.phone && dto.phone !== user.phone) {
      const existingPhone = await this.db
        .select()
        .from(users)
        .where(eq(users.phone, dto.phone))
        .limit(1);
      if (existingPhone[0]) {
        throw new ConflictException("手机号已被使用");
      }
    }

    const result = await this.db
      .update(users)
      .set({
        username: dto.username,
        email: dto.email,
        phone: dto.phone,
        nickname: dto.nickname,
        avatar: dto.avatar,
        role: dto.role as UserRoleType,
        level: dto.level as UserLevelType,
        isActive: dto.isActive,
      } as any)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async softDelete(id: string) {
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!existing[0]) {
      throw new NotFoundException("用户不存在");
    }
    await this.db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, id));
    return { message: "删除成功" };
  }

  async resetPassword(id: string, newPassword?: string) {
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!existing[0]) {
      throw new NotFoundException("用户不存在");
    }

    const password = newPassword || this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id));

    return { message: "密码重置成功", password };
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
