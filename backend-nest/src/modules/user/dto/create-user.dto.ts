import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsEmail,
  Matches,
} from "class-validator";
import { Transform } from "class-transformer";

export const userRoles = ["user", "admin", "super_admin"] as const;
export type UserRole = (typeof userRoles)[number];

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: "用户名不能为空" })
  @Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message: "用户名只能包含字母、数字、下划线，长度3-20位",
  })
  username: string;

  @IsString()
  @IsNotEmpty({ message: "密码不能为空" })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/, {
    message: "密码必须包含字母和数字，长度6-20位",
  })
  password: string;

  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsOptional()
  @IsEmail({}, { message: "邮箱格式不正确" })
  email?: string;

  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsString()
  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/, { message: "手机号格式不正确" })
  phone?: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsEnum(userRoles, { message: "角色不正确" })
  @IsOptional()
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
