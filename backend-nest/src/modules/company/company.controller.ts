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
  ParseIntPipe,
} from "@nestjs/common";
import { CompanyService } from "./company.service";
import { CreateCompanyDto, UpdateCompanyDto, QueryCompanyDto } from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../../common/guards/admin.guard";

@Controller("companies")
@UseGuards(JwtAuthGuard, AdminGuard)
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get()
  findAll(@Query() query: QueryCompanyDto) {
    return this.companyService.findAll(query);
  }

  @Get("statistics")
  getStatistics() {
    return this.companyService.getStatistics();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.companyService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCompanyDto) {
    return this.companyService.create(dto);
  }

  @Put(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCompanyDto) {
    return this.companyService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.companyService.remove(id);
  }
}
