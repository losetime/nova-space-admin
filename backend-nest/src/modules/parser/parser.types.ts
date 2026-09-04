export interface TrackingRecord {
  id: number;
  titleEn: string;
  titleCn: string;
  source: string;
  publishTime: Date | null;
  url: string;
}

export interface DocxArticle {
  index: number;
  title: string;
  body: string[];
  images: EmbeddedImage[];
}

export interface EmbeddedImage {
  fileName: string;
  mimeType: string;
  data: Buffer;
  articleIndex: number;
  position: number;
}

export interface AlignmentResult {
  matched: {
    titleEn: string;
    titleCn: string;
    xlsxIndex: number;
    docxOriginalIndex: number;
    docxTranslatedIndex: number;
    matchScoreOriginal: number;
    matchScoreTranslated: number;
  }[];
  onlyInXlsx: { titleEn: string; titleCn: string }[];
  onlyInDocx: { title: string; language: "en" | "zh" }[];
  warnings: string[];
}

export interface DailyReportResult {
  articles: {
    id: number;
    titleEn: string;
    titleCn: string;
    matchScore: number;
  }[];
  warnings: string[];
}

export interface ParsedDocx {
  articles: DocxArticle[];
  allImages: EmbeddedImage[];
}
