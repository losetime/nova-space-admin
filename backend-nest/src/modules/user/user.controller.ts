import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto, UpdateUserDto, QueryUserDto } from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../../common/guards/admin.guard";

@Controller("users")
@UseGuards(JwtAuthGuard, AdminGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.userService.softDelete(id);
  }

  @Post(":id/reset-password")
  resetPassword(@Param("id") id: string, @Body("password") password?: string) {
    return this.userService.resetPassword(id, password);
  }
}
