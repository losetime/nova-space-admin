import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { FeedbackService } from "./feedback.service";
import { QueryFeedbackDto, UpdateFeedbackDto } from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../../common/guards/admin.guard";

@Controller("feedback")
@UseGuards(JwtAuthGuard, AdminGuard)
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Get()
  findAll(@Query() query: QueryFeedbackDto) {
    return this.feedbackService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.feedbackService.findOne(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateFeedbackDto) {
    return this.feedbackService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.feedbackService.remove(id);
  }
}
