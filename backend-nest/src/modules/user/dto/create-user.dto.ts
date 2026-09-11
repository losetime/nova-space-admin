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
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsNotEmpty({ message: "邮箱不能为空" })
  @IsEmail({}, { message: "邮箱格式不正确" })
  email: string;

  @IsString()
  @IsNotEmpty({ message: "密码不能为空" })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/, {
    message: "密码必须包含字母和数字，长度6-20位",
  })
  password: string;

  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsString()
  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/, { message: "手机号格式不正确" })
  phone?: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsEnum(userRoles, { message: "角色不正确" })
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  level?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
