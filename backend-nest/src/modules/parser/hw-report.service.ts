import { Injectable, Inject } from "@nestjs/common";
import { eq } from "drizzle-orm";
import type { Database } from "../../database";
import { intelligences } from "../../database/schema/intelligences";
import { UploadService } from "../upload/upload.service";
import {
  TrackingRecord,
  DocxArticle,
  EmbeddedImage,
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

        // 上传所有图片到MinIO（中英文共用同一组图片）
        const imageMap = await this.uploadImages(
          translatedArticle.images,
          result.warnings,
          match.titleCn,
        );

        // cover保持第一张图片
        const cover = imageMap.get(0) || null;

        // 组装数据
        const titleEn = match.titleEn;
        const titleCn = match.titleCn;
        const contentEn = this.buildContentWithImages(
          originalArticle.body,
          imageMap,
        );
        const contentCn = this.buildContentWithImages(
          translatedArticle.body,
          imageMap,
        );
        const source = this.findSource(trackingRecords, match.xlsxIndex);
        const sourceUrl = this.findSourceUrl(trackingRecords, match.xlsxIndex);
        const publishedAt = this.findPublishTime(
          trackingRecords,
          match.xlsxIndex,
        );

        // 生成智能摘要（跳过图片描述和过短段落）
        const summary = this.generateSummary(contentCn);

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

  /**
   * 上传图片到MinIO，返回 position -> URL 的映射
   */
  private async uploadImages(
    images: EmbeddedImage[],
    warnings: string[],
    articleTitle: string,
  ): Promise<Map<number, string>> {
    const imageMap = new Map<number, string>();

    for (const img of images) {
      try {
        const uploadResult = await this.uploadService.uploadImage({
          buffer: img.data,
          originalname: img.fileName.split("/").pop() || "image.jpeg",
          mimetype: img.mimeType,
          size: img.data.length,
        } as Express.Multer.File);
        imageMap.set(img.position, uploadResult.url);
      } catch (error) {
        warnings.push(`文章 "${articleTitle}" 图片上传失败: ${error.message}`);
      }
    }

    return imageMap;
  }

  /**
   * 根据图片位置组装content，保持原始排版
   */
  private buildContentWithImages(
    body: string[],
    imageMap: Map<number, string>,
  ): string {
    const parts: string[] = [];

    body.forEach((paragraph, index) => {
      // 在段落前检查是否有图片
      if (imageMap.has(index)) {
        parts.push(`<p><img src="${imageMap.get(index)}" /></p>`);
      }
      parts.push(`<p>${paragraph}</p>`);
    });

    return parts.join("");
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

  /**
   * 检测是否为图片描述段落
   */
  private isImageDescription(paragraph: string): boolean {
    const keywords = [
      "图片来源",
      "照片来源",
      "Credit",
      "拍摄者",
      "图片说明",
      "照片",
    ];
    return keywords.some((keyword) => paragraph.includes(keyword));
  }

  /**
   * 检测段落是否过短（少于10个字符）
   */
  private isTooShort(paragraph: string): boolean {
    return paragraph.length < 10;
  }

  /**
   * 生成智能摘要：跳过图片描述和过短段落，取第一个有效段落
   */
  private generateSummary(contentCn: string): string {
    // 从content中提取有效段落（去掉HTML标签）
    const paragraphs = contentCn
      .split("</p>")
      .map((p) => p.replace(/<[^>]*>/g, "").trim())
      .filter((p) => p && !this.isImageDescription(p) && !this.isTooShort(p));

    // 取第一段作为摘要
    if (paragraphs.length > 0) {
      return paragraphs[0].substring(0, 150).trim();
    }

    // 降级处理：直接截取前150个字符
    return contentCn
      .replace(/<[^>]*>/g, "")
      .substring(0, 150)
      .trim();
  }
}
