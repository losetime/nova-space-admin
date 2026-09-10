import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
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
  create(@Body() dto: CreateUserDto, @Req() req: any) {
    return this.userService.create(dto, req.user);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto, @Req() req: any) {
    return this.userService.update(id, dto, req.user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: any) {
    return this.userService.softDelete(id, req.user);
  }

  @Delete(":id/hard")
  hardDelete(@Param("id") id: string, @Req() req: any) {
    return this.userService.hardDelete(id, req.user);
  }

  @Post(":id/reset-password")
  resetPassword(
    @Param("id") id: string,
    @Body("password") password: string | undefined,
    @Req() req: any,
  ) {
    return this.userService.resetPassword(id, req.user, password);
  }
}
