import { Module } from "@nestjs/common";
import { ParserController } from "./parser.controller";
import { XlsxParserService } from "./xlsx-parser.service";
import { DocxParserService } from "./docx-parser.service";
import { AlignmentService } from "./alignment.service";
import { HwReportService } from "./hw-report.service";
import { DatabaseModule } from "../../database/database.module";
import { UploadModule } from "../upload/upload.module";

@Module({
  imports: [DatabaseModule, UploadModule],
  controllers: [ParserController],
  providers: [
    XlsxParserService,
    DocxParserService,
    AlignmentService,
    HwReportService,
  ],
  exports: [
    XlsxParserService,
    DocxParserService,
    AlignmentService,
    HwReportService,
  ],
})
export class ParserModule {}
