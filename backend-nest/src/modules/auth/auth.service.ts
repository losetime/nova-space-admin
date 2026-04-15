import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import type { Database } from "../../database";
import { users } from "../../database/schema/users";

export interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  nickname: string | null;
  avatar: string | null;
  role: string;
  level: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: Date;
}

function userWithoutPassword(
  user: typeof users.$inferSelect,
): Omit<typeof users.$inferSelect, "password"> {
  const { password: _, ...rest } = user;
  return rest;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject("DATABASE") private db: Database,
    private jwtService: JwtService,
  ) {}

  async login(
    username: string,
    password: string,
  ): Promise<{ user: UserProfile; token: string }> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    const user = result[0];

    if (!user) {
      throw new UnauthorizedException("用户名或密码错误");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("用户名或密码错误");
    }

    if (!user.is_active) {
      throw new UnauthorizedException("账号已被禁用");
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      throw new UnauthorizedException("没有管理员权限");
    }

    const token = this.generateToken(user);

    return { user: userWithoutPassword(user), token };
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const user = result[0];
    if (!user) return null;

    return userWithoutPassword(user);
  }

  async validateUserById(userId: string): Promise<{
    id: string;
    username: string;
    role: string;
    level: string;
  } | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const user = result[0];
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      level: user.level,
    };
  }

  private generateToken(user: {
    id: string;
    username: string;
    role: string;
    level: string;
  }): string {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      level: user.level,
    };
    return this.jwtService.sign(payload);
  }
}
