import { IsEnum, IsOptional, IsBoolean } from "class-validator";
import { userRoles } from "./create-user.dto";
import type { UserRole } from "./create-user.dto";

export class UpdateUserDto {
  @IsEnum(userRoles, { message: "角色不正确" })
  @IsOptional()
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
