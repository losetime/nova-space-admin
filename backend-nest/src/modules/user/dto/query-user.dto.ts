import { IsOptional, IsEnum, IsBoolean, IsInt, Min } from "class-validator";
import { Transform, Type } from "class-transformer";
import { userRoles } from "./create-user.dto";
import type { UserRole } from "./create-user.dto";

export class QueryUserDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @IsOptional()
  keyword?: string;

  @IsEnum(userRoles, { message: "角色不正确" })
  @IsOptional()
  role?: UserRole;

  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
