import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {}

  getImageInfo(file: Express.Multer.File) {
    const baseUrl = this.configService.get<string>('app.baseUrl') || '';
    const imageUrl = `${baseUrl}/uploads/images/${file.filename}`;

    return {
      url: imageUrl,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}