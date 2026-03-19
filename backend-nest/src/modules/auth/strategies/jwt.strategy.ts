import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'nova-space-secret-key-2024',
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUserById(payload.sub);
    return user
      ? { id: payload.sub, username: payload.username, role: payload.role, level: payload.level }
      : null;
  }
}