import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { parse } from "csv-parse/sync";
import * as xlsx from "xlsx";
import { ArticleService } from "../article/article.service";
import { IntelligenceService } from "../intelligence/intelligence.service";

export type IntelligenceCategory =
  | "launch"
  | "satellite"
  | "industry"
  | "research"
  | "environment";
export type IntelligenceLevel = "free" | "advanced" | "professional";

interface ArticleImportRecord {
  title: string;
  content: string;
  summary?: string;
  category: string;
  cover?: string;
  tags?: string;
}

interface IntelligenceImportRecord {
  title: string;
  content: string;
  summary: string;
  category: string;
  level: string;
  source: string;
  cover?: string;
  sourceUrl?: string;
  tags?: string;
}

type ImportRecord = ArticleImportRecord & Partial<IntelligenceImportRecord>;

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

@Injectable()
export class ImportService {
  constructor(
    private articleService: ArticleService,
    private intelligenceService: IntelligenceService,
  ) {}

  async importArticles(
    file: Express.Multer.File,
    format: "csv" | "excel",
  ): Promise<ImportResult> {
    const records = this.parseFile(file, format) as ArticleImportRecord[];
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    const validArticles: Partial<any>[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNum = i + 2; // Excel/CSV 行号从 2 开始（第1行是标题）

      try {
        // 验证必填字段
        if (!record.title) {
          result.errors.push(`第${rowNum}行: 标题不能为空`);
          result.failed++;
          continue;
        }
        if (!record.content) {
          result.errors.push(`第${rowNum}行: 内容不能为空`);
          result.failed++;
          continue;
        }
        if (!record.category) {
          result.errors.push(`第${rowNum}行: 分类不能为空`);
          result.failed++;
          continue;
        }

        // 验证分类
        const validCategories = ["basic", "advanced", "mission", "people"];
        if (!validCategories.includes(record.category)) {
          result.errors.push(
            `第${rowNum}行: 分类值不正确，可选值: ${validCategories.join(", ")}`,
          );
          result.failed++;
          continue;
        }

        const article: Partial<any> = {
          title: record.title,
          content: record.content,
          summary: record.summary || "",
          category: record.category,
          cover: record.cover || "",
          tags: record.tags
            ? String(record.tags)
                .split(",")
                .map((t) => t.trim())
            : [],
          type: "article",
          isPublished: true,
        };

        validArticles.push(article);
      } catch (error) {
        result.errors.push(`第${rowNum}行: ${error.message}`);
        result.failed++;
      }
    }

    // 批量创建
    if (validArticles.length > 0) {
      try {
        await this.articleService.batchCreate(validArticles);
        result.success = validArticles.length;
      } catch (error) {
        throw new InternalServerErrorException(
          `批量导入失败: ${error.message}`,
        );
      }
    }

    return result;
  }

  async importIntelligences(
    file: Express.Multer.File,
    format: "csv" | "excel",
  ): Promise<ImportResult> {
    const records = this.parseFile(file, format) as IntelligenceImportRecord[];
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    const validIntelligences: Partial<any>[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNum = i + 2;

      try {
        // 验证必填字段
        if (!record.title) {
          result.errors.push(`第${rowNum}行: 标题不能为空`);
          result.failed++;
          continue;
        }
        if (!record.content) {
          result.errors.push(`第${rowNum}行: 内容不能为空`);
          result.failed++;
          continue;
        }
        if (!record.summary) {
          result.errors.push(`第${rowNum}行: 摘要不能为空`);
          result.failed++;
          continue;
        }
        if (!record.category) {
          result.errors.push(`第${rowNum}行: 分类不能为空`);
          result.failed++;
          continue;
        }
        if (!record.level) {
          result.errors.push(`第${rowNum}行: 等级不能为空`);
          result.failed++;
          continue;
        }
        if (!record.source) {
          result.errors.push(`第${rowNum}行: 来源不能为空`);
          result.failed++;
          continue;
        }

        // 验证分类
        const validCategories = [
          "launch",
          "satellite",
          "industry",
          "research",
          "environment",
        ];
        if (!validCategories.includes(record.category)) {
          result.errors.push(
            `第${rowNum}行: 分类值不正确，可选值: ${validCategories.join(", ")}`,
          );
          result.failed++;
          continue;
        }

        // 验证等级
        const validLevels = ["free", "advanced", "professional"];
        if (!validLevels.includes(record.level)) {
          result.errors.push(
            `第${rowNum}行: 等级值不正确，可选值: ${validLevels.join(", ")}`,
          );
          result.failed++;
          continue;
        }

        const intelligence: Partial<any> = {
          title: record.title,
          content: record.content,
          summary: record.summary,
          category: record.category,
          level: record.level,
          source: record.source,
          cover: record.cover || "",
          sourceUrl: record.sourceUrl || "",
          tags: record.tags || "",
        };

        validIntelligences.push(intelligence);
      } catch (error) {
        result.errors.push(`第${rowNum}行: ${error.message}`);
        result.failed++;
      }
    }

    // 批量创建
    if (validIntelligences.length > 0) {
      try {
        await this.intelligenceService.batchCreate(validIntelligences);
        result.success = validIntelligences.length;
      } catch (error) {
        throw new InternalServerErrorException(
          `批量导入失败: ${error.message}`,
        );
      }
    }

    return result;
  }

  private parseFile(
    file: Express.Multer.File,
    format: "csv" | "excel",
  ): ImportRecord[] {
    if (format === "csv") {
      return this.parseCsv(file.buffer);
    } else {
      return this.parseExcel(file.buffer);
    }
  }

  private parseCsv(buffer: Buffer): ImportRecord[] {
    try {
      const content = buffer.toString("utf-8");
      return parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as ImportRecord[];
    } catch (error) {
      throw new BadRequestException(`CSV解析失败: ${error.message}`);
    }
  }

  private parseExcel(buffer: Buffer): ImportRecord[] {
    try {
      const workbook = xlsx.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      return xlsx.utils.sheet_to_json(sheet);
    } catch (error) {
      throw new BadRequestException(`Excel解析失败: ${error.message}`);
    }
  }
}
