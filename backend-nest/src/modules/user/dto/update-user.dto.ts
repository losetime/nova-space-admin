import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsEmail,
  Matches,
} from 'class-validator';
import { UserRole, UserLevel } from '../../../common/entities/user.entity';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message: '用户名只能包含字母、数字、下划线，长度3-20位',
  })
  username?: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsEnum(UserRole, { message: '角色不正确' })
  @IsOptional()
  role?: UserRole;

  @IsEnum(UserLevel, { message: '等级不正确' })
  @IsOptional()
  level?: UserLevel;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}