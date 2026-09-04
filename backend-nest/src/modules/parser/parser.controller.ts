import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import * as fs from "fs";
import * as path from "path";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../../common/guards/admin.guard";
import { XlsxParserService } from "./xlsx-parser.service";
import { DocxParserService } from "./docx-parser.service";
import { AlignmentService } from "./alignment.service";
import { HwReportService } from "./hw-report.service";

const LOG_DIR = path.join(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(path.join(LOG_DIR, "parser.log"), line);
  console.log(line.trim());
}

interface MulterOptionsExtended {
  dest?: string | Function;
  storage?: any;
  limits?: any;
  preservePath?: boolean;
  defParamCharset?: string;
  fileFilter?: any;
}

@Controller("parser")
@UseGuards(JwtAuthGuard, AdminGuard)
export class ParserController {
  constructor(
    private readonly xlsxParserService: XlsxParserService,
    private readonly docxParserService: DocxParserService,
    private readonly alignmentService: AlignmentService,
    private readonly hwReportService: HwReportService,
  ) {}

  @Post("daily-report")
  @UseInterceptors(
    FilesInterceptor("files", 3, {
      defParamCharset: 'utf8',
      fileFilter: (req: any, file: any, cb: any) => {
        const allowedMimes = [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException("只支持 .xlsx 和 .docx 文件格式"), false);
        }
      },
    } as MulterOptionsExtended),
  )
  async parseDailyReport(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length !== 3) {
      throw new BadRequestException(
        "请上传3个文件：xlsx跟踪表、原文.docx、译文.docx",
      );
    }

    // 识别文件类型
    const xlsxFile = files.find((f) => f.originalname.endsWith(".xlsx"));
    const docxFiles = files.filter((f) => f.originalname.endsWith(".docx"));

    log(`[FILES] 上传文件数: ${files.length}`);
    files.forEach((f, i) => {
      log(`[FILES] 文件${i + 1}: [${f.originalname}] (${f.mimetype})`);
    });

    if (!xlsxFile || docxFiles.length !== 2) {
      throw new BadRequestException(
        "请确保上传的文件包含：1个xlsx跟踪表和2个docx文件",
      );
    }

    // 识别原文和译文（根据文件名关键词）
    const originalFile = docxFiles.find(
      (f) => {
        const name = f.originalname;
        const hasKeyword = name.includes("原文") || name.includes("original");
        log(`[FILES] 检查原文: [${name}] => ${hasKeyword}`);
        return hasKeyword;
      },
    );
    const translatedFile = docxFiles.find(
      (f) => {
        const name = f.originalname;
        const hasKeyword = name.includes("译文") || name.includes("translated") || name.includes("translation");
        log(`[FILES] 检查译文: [${name}] => ${hasKeyword}`);
        return hasKeyword;
      },
    );

    log(`[FILES] 文件名识别: originalFile=[${originalFile?.originalname}] translatedFile=[${translatedFile?.originalname}]`);

    if (!originalFile || !translatedFile) {
      throw new BadRequestException(
        "无法识别原文和译文文件，请确保文件名包含'原文'和'译文'字样",
      );
    }

    const finalOriginal = originalFile;
    const finalTranslated = translatedFile;

    // 解析xlsx跟踪表
    const trackingRecords = await this.xlsxParserService.parse(xlsxFile.buffer);
    log(`[XLSX] 解析完成，记录数: ${trackingRecords.length}`);
    trackingRecords.forEach((r, i) => {
      log(`[XLSX] 记录${i + 1}: en=[${r.titleEn}] cn=[${r.titleCn}]`);
    });

    if (trackingRecords.length === 0) {
      throw new BadRequestException("xlsx跟踪表中没有找到有效数据");
    }

    // 解析原文docx
    const originalDocx = await this.docxParserService.parse(
      finalOriginal.buffer,
    );
    log(`[DOCX-ORIGINAL] 解析完成，文章数: ${originalDocx.articles.length}`);
    originalDocx.articles.forEach((a, i) => {
      log(`[DOCX-ORIGINAL] 文章${i + 1}: [${a.title}]`);
    });

    if (originalDocx.articles.length === 0) {
      throw new BadRequestException("原文docx中没有找到文章");
    }

    // 解析译文docx
    const translatedDocx = await this.docxParserService.parse(
      finalTranslated.buffer,
    );
    log(`[DOCX-TRANSLATED] 解析完成，文章数: ${translatedDocx.articles.length}`);
    translatedDocx.articles.forEach((a, i) => {
      log(`[DOCX-TRANSLATED] 文章${i + 1}: [${a.title}]`);
    });

    if (translatedDocx.articles.length === 0) {
      throw new BadRequestException("译文docx中没有找到文章");
    }

    // 标题对齐
    const alignment = this.alignmentService.align(
      trackingRecords,
      originalDocx.articles,
      translatedDocx.articles,
    );
    log(`[ALIGNMENT] 匹配成功: ${alignment.matched.length} 篇`);
    log(`[ALIGNMENT] 仅在xlsx: ${alignment.onlyInXlsx.length} 篇`);
    log(`[ALIGNMENT] 仅在docx: ${alignment.onlyInDocx.length} 篇`);
    log(`[ALIGNMENT] 警告: ${alignment.warnings.length} 条`);
    alignment.warnings.forEach((w, i) => {
      log(`[ALIGNMENT] 警告${i + 1}: ${w}`);
    });

    // 存储到数据库
    const result = await this.hwReportService.saveArticles(
      trackingRecords,
      originalDocx.articles,
      translatedDocx.articles,
      alignment,
    );

    return result;
  }
}
