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
} from '@nestjs/common';
import { MembershipService } from './membership.service';
import {
  CreatePlanDto,
  UpdatePlanDto,
  QueryPlanDto,
  CreateBenefitDto,
  UpdateBenefitDto,
  QueryBenefitDto,
  CreateLevelDto,
  UpdateLevelDto,
  QueryLevelDto,
  ConfigureLevelBenefitsDto,
  AddLevelBenefitDto,
  QuerySubscriptionDto,
  AdminActivateDto,
  AdminCancelDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('membership')
@UseGuards(JwtAuthGuard, AdminGuard)
export class MembershipController {
  constructor(private membershipService: MembershipService) {}

  // ============ Plans ============

  @Get('plans')
  findAllPlans(@Query() query: QueryPlanDto) {
    return this.membershipService.findAllPlans(query);
  }

  @Get('plans/:id')
  findPlanById(@Param('id') id: string) {
    return this.membershipService.findPlanById(id);
  }

  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.membershipService.createPlan(dto);
  }

  @Put('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.membershipService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  deletePlan(@Param('id') id: string) {
    return this.membershipService.deletePlan(id);
  }

  // ============ Benefits ============

  @Get('benefits')
  findAllBenefits(@Query() query: QueryBenefitDto) {
    return this.membershipService.findAllBenefits(query);
  }

  @Get('benefits/:id')
  findBenefitById(@Param('id') id: string) {
    return this.membershipService.findBenefitById(id);
  }

  @Post('benefits')
  createBenefit(@Body() dto: CreateBenefitDto) {
    return this.membershipService.createBenefit(dto);
  }

  @Put('benefits/:id')
  updateBenefit(@Param('id') id: string, @Body() dto: UpdateBenefitDto) {
    return this.membershipService.updateBenefit(id, dto);
  }

  @Delete('benefits/:id')
  deleteBenefit(@Param('id') id: string) {
    return this.membershipService.deleteBenefit(id);
  }

  // ============ Member Levels ============

  @Get('levels')
  findAllLevels(@Query() query: QueryLevelDto) {
    return this.membershipService.findAllLevels(query);
  }

  @Get('levels/:id')
  findLevelById(@Param('id') id: string) {
    return this.membershipService.findLevelById(id);
  }

  @Post('levels')
  createLevel(@Body() dto: CreateLevelDto) {
    return this.membershipService.createLevel(dto);
  }

  @Put('levels/:id')
  updateLevel(@Param('id') id: string, @Body() dto: UpdateLevelDto) {
    return this.membershipService.updateLevel(id, dto);
  }

  @Delete('levels/:id')
  deleteLevel(@Param('id') id: string) {
    return this.membershipService.deleteLevel(id);
  }

  @Put('levels/:id/benefits')
  configureLevelBenefits(@Param('id') id: string, @Body() dto: ConfigureLevelBenefitsDto) {
    return this.membershipService.configureLevelBenefits(id, dto);
  }

  @Post('levels/:id/benefits')
  addLevelBenefit(@Param('id') id: string, @Body() dto: AddLevelBenefitDto) {
    return this.membershipService.addLevelBenefit(id, dto);
  }

  @Delete('levels/:id/benefits/:benefitId')
  removeLevelBenefit(@Param('id') id: string, @Param('benefitId') benefitId: string) {
    return this.membershipService.removeLevelBenefit(id, benefitId);
  }

  // ============ Subscriptions ============

  @Get('subscriptions')
  findAllSubscriptions(@Query() query: QuerySubscriptionDto) {
    return this.membershipService.findAllSubscriptions(query);
  }

  @Get('subscriptions/:id')
  findSubscriptionById(@Param('id') id: string) {
    return this.membershipService.findSubscriptionById(id);
  }

  @Post('users/:userId/activate')
  adminActivate(@Param('userId') userId: string, @Body() dto: AdminActivateDto) {
    return this.membershipService.adminActivate(userId, dto);
  }

  @Post('subscriptions/:id/extend')
  adminExtend(
    @Param('id') id: string,
    @Body('months') months: number,
    @Body('reason') reason?: string,
  ) {
    return this.membershipService.adminExtend(id, months, reason);
  }

  @Post('subscriptions/:id/cancel')
  adminCancel(@Param('id') id: string, @Body() dto: AdminCancelDto) {
    return this.membershipService.adminCancel(id, dto);
  }

  // ============ Statistics ============

  @Get('statistics')
  getStatistics() {
    return this.membershipService.getStatistics();
  }
}