import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ImportController } from "./import.controller";
import { ImportService } from "./import.service";
import { ArticleModule } from "../article/article.module";
import { IntelligenceModule } from "../intelligence/intelligence.module";

@Module({
  imports: [
    ArticleModule,
    IntelligenceModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
