import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('import')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('articles')
  @UseInterceptors(FileInterceptor('file'))
  async importArticles(
    @UploadedFile() file: Express.Multer.File,
    @Query('format') format: 'csv' | 'excel',
  ) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    if (!format || !['csv', 'excel'].includes(format)) {
      throw new BadRequestException('请指定文件格式: csv 或 excel');
    }

    return this.importService.importArticles(file, format);
  }

  @Post('intelligence')
  @UseInterceptors(FileInterceptor('file'))
  async importIntelligences(
    @UploadedFile() file: Express.Multer.File,
    @Query('format') format: 'csv' | 'excel',
  ) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    if (!format || !['csv', 'excel'].includes(format)) {
      throw new BadRequestException('请指定文件格式: csv 或 excel');
    }

    return this.importService.importIntelligences(file, format);
  }
}