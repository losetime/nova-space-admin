import { Injectable, Inject } from "@nestjs/common";
import { eq } from "drizzle-orm";
import type { Database } from "../../database";
import { intelligences } from "../../database/schema/intelligences";
import { UploadService } from "../upload/upload.service";
import {
  TrackingRecord,
  DocxArticle,
  AlignmentResult,
  DailyReportResult,
} from "./parser.types";

@Injectable()
export class HwReportService {
  constructor(
    @Inject("DATABASE") private db: Database,
    private readonly uploadService: UploadService,
  ) {}

  async saveArticles(
    trackingRecords: TrackingRecord[],
    originalArticles: DocxArticle[],
    translatedArticles: DocxArticle[],
    alignment: AlignmentResult,
  ): Promise<DailyReportResult> {
    const result: DailyReportResult = {
      articles: [],
      warnings: [...alignment.warnings],
    };

    // 事务性批量入库
    await this.db.transaction(async (tx) => {
      for (const match of alignment.matched) {
        // 找到对应的原文和译文
        const originalArticle = originalArticles.find(
          (a) => a.index === match.docxOriginalIndex,
        );
        const translatedArticle = translatedArticles.find(
          (a) => a.index === match.docxTranslatedIndex,
        );

        if (!originalArticle || !translatedArticle) {
          result.warnings.push(`文章 "${match.titleCn}" 的原文或译文缺失`);
          continue;
        }

        // 组装数据
        const titleEn = match.titleEn;
        const titleCn = match.titleCn;
        const contentEn = originalArticle.body.map(p => `<p>${p}</p>`).join("");
        const contentCn = translatedArticle.body.map(p => `<p>${p}</p>`).join("");
        const source = this.findSource(trackingRecords, match.xlsxIndex);
        const sourceUrl = this.findSourceUrl(trackingRecords, match.xlsxIndex);
        const publishedAt = this.findPublishTime(
          trackingRecords,
          match.xlsxIndex,
        );

        // 上传封面图片到MinIO
        let cover = null;
        const coverImage = translatedArticle.images[0];
        if (coverImage) {
          try {
            const uploadResult = await this.uploadService.uploadImage({
              buffer: coverImage.data,
              originalname: coverImage.fileName.split("/").pop() || "image.jpeg",
              mimetype: coverImage.mimeType,
              size: coverImage.data.length,
            } as Express.Multer.File);
            cover = uploadResult.url;
          } catch (error) {
            result.warnings.push(`文章 "${titleCn}" 图片上传失败: ${error.message}`);
          }
        }

        // 生成摘要（取前200个字符）
        const summary = contentCn.substring(0, 200).trim() + "...";

        // 检查重复性（根据中文标题）
        const existing = await tx
          .select({ id: intelligences.id })
          .from(intelligences)
          .where(eq(intelligences.title, titleCn))
          .limit(1);

        if (existing.length > 0) {
          result.warnings.push(`文章 "${titleCn}" 已存在，跳过`);
          continue;
        }

        // 插入数据库
        const insertResult = await tx
          .insert(intelligences)
          .values({
            title: titleCn,
            titleEn: titleEn,
            summary: summary,
            content: contentCn,
            contentEn: contentEn,
            cover: cover,
            category: "industry",
            level: "professional",
            source: source || "HW专报",
            sourceUrl: sourceUrl || "",
            publishedAt: publishedAt,
            tags: "HW,专报",
          })
          .returning();

        const intelligence = insertResult[0];

        result.articles.push({
          id: intelligence.id,
          titleEn: titleEn,
          titleCn: titleCn,
          matchScore: Math.round(
            ((match.matchScoreOriginal + match.matchScoreTranslated) / 2) * 100,
          ),
        });
      }
    });

    // 检查未匹配的文章
    if (alignment.onlyInXlsx.length > 0) {
      result.warnings.push(
        `${alignment.onlyInXlsx.length} 篇文章在docx中未找到匹配`,
      );
    }

    return result;
  }

  private findSource(
    trackingRecords: TrackingRecord[],
    xlsxIndex: number,
  ): string | null {
    const record = trackingRecords.find((r) => r.id === xlsxIndex);
    return record?.source || null;
  }

  private findSourceUrl(
    trackingRecords: TrackingRecord[],
    xlsxIndex: number,
  ): string | null {
    const record = trackingRecords.find((r) => r.id === xlsxIndex);
    return record?.url || null;
  }

  private findPublishTime(
    trackingRecords: TrackingRecord[],
    xlsxIndex: number,
  ): Date | null {
    const record = trackingRecords.find((r) => r.id === xlsxIndex);
    return record?.publishTime || null;
  }
}
