import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { Database } from '../../database';
import { users } from '../../database/schema/users';

type UserRoleType = 'user' | 'admin' | 'super_admin';

@Injectable()
export class AuthService {
  constructor(@Inject('DATABASE') private db: Database, private jwtService: JwtService) {}

  async login(username: string, password: string): Promise<{ user: any; token: string }> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    const user = result[0];

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('账号已被禁用');
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new UnauthorizedException('没有管理员权限');
    }

    const token = this.generateToken(user);

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  async getProfile(userId: string): Promise<any | null> {
    const result = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = result[0];
    if (!user) return null;

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async validateUserById(userId: string): Promise<any | null> {
    const result = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    return result[0] || null;
  }

  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      level: user.level,
    };
    return this.jwtService.sign(payload);
  }
}