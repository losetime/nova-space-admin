import { Injectable } from "@nestjs/common";
import { TrackingRecord, DocxArticle, AlignmentResult } from "./parser.types";

@Injectable()
export class AlignmentService {
  private readonly MATCH_THRESHOLD = 0.8;

  align(
    trackingRecords: TrackingRecord[],
    originalArticles: DocxArticle[],
    translatedArticles: DocxArticle[],
  ): AlignmentResult {
    const result: AlignmentResult = {
      matched: [],
      onlyInXlsx: [],
      onlyInDocx: [],
      warnings: [],
    };

    const matchedOriginalIndices = new Set<number>();
    const matchedTranslatedIndices = new Set<number>();

    for (const record of trackingRecords) {
      // 匹配英文标题（跟踪表 vs 原文）
      const originalMatch = this.findBestMatch(
        record.titleEn,
        originalArticles.map((a) => a.title),
      );

      // 匹配中文标题（跟踪表 vs 译文）
      const translatedMatch = this.findBestMatch(
        record.titleCn,
        translatedArticles.map((a) => a.title),
      );

      if (originalMatch && translatedMatch) {
        result.matched.push({
          titleEn: record.titleEn,
          titleCn: record.titleCn,
          xlsxIndex: record.id,
          docxOriginalIndex: originalMatch.index,
          docxTranslatedIndex: translatedMatch.index,
          matchScoreOriginal: originalMatch.score,
          matchScoreTranslated: translatedMatch.score,
        });

        matchedOriginalIndices.add(originalMatch.index);
        matchedTranslatedIndices.add(translatedMatch.index);

        // 检查匹配度警告
        if (
          originalMatch.score < this.MATCH_THRESHOLD ||
          translatedMatch.score < this.MATCH_THRESHOLD
        ) {
          result.warnings.push(
            `文章 "${record.titleCn}" 匹配度较低: 原文 ${Math.round(originalMatch.score * 100)}%, 译文 ${Math.round(translatedMatch.score * 100)}%`,
          );
        }
      } else {
        result.onlyInXlsx.push({
          titleEn: record.titleEn,
          titleCn: record.titleCn,
        });
        result.warnings.push(
          `跟踪表中的文章 "${record.titleCn}" 在docx中未找到匹配`,
        );
      }
    }

    // 检查docx中有但跟踪表中没有的文章
    for (const article of originalArticles) {
      if (!matchedOriginalIndices.has(article.index)) {
        result.onlyInDocx.push({
          title: article.title,
          language: "en",
        });
      }
    }

    for (const article of translatedArticles) {
      if (!matchedTranslatedIndices.has(article.index)) {
        result.onlyInDocx.push({
          title: article.title,
          language: "zh",
        });
      }
    }

    return result;
  }

  private findBestMatch(
    target: string,
    candidates: string[],
  ): { index: number; score: number } | null {
    let bestMatch: { index: number; score: number } | null = null;

    for (let i = 0; i < candidates.length; i++) {
      const score = this.calculateSimilarity(target, candidates[i]);
      if (score >= this.MATCH_THRESHOLD) {
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { index: i + 1, score }; // index从1开始
        }
      }
    }

    return bestMatch;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // 预处理：转小写，去除多余空格
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // 如果完全相同，返回1
    if (s1 === s2) return 1;

    // 如果一个是另一个的子串，返回较高相似度
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.9;
    }

    // 计算Levenshtein距离
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
