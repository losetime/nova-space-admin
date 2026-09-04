import { Injectable, BadRequestException } from "@nestjs/common";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { DocxArticle, EmbeddedImage, ParsedDocx } from "./parser.types";

@Injectable()
export class DocxParserService {
  async parse(buffer: Buffer): Promise<ParsedDocx> {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const docXmlFile = zip.file("word/document.xml");

      if (!docXmlFile) {
        throw new BadRequestException("docx文件中没有document.xml");
      }

      const docXml = await docXmlFile.async("string");
      const parser = new XMLParser({
        ignoreAttributes: false,
      });
      const doc = parser.parse(docXml);
      const body = doc["w:document"]["w:body"];

      // 提取所有图片
      const allImages = await this.extractAllImages(zip);

      // 提取段落
      const paragraphs = body["w:p"] || [];
      const paragraphsArray = Array.isArray(paragraphs)
        ? paragraphs
        : [paragraphs];

      // 按"N."格式切分文章
      const articles = this.splitArticles(paragraphsArray, allImages);

      return { articles, allImages };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`解析docx文件失败: ${error.message}`);
    }
  }

  private async extractAllImages(zip: JSZip): Promise<EmbeddedImage[]> {
    const images: EmbeddedImage[] = [];
    const mediaFolder = zip.folder("word/media");

    if (mediaFolder) {
      const files: { path: string; file: JSZip.JSZipObject }[] = [];

      mediaFolder.forEach((path, file) => {
        if (path.match(/\.(jpeg|png|gif|jpg)$/i)) {
          files.push({ path, file });
        }
      });

      for (const { path, file } of files) {
        const data = await file.async("nodebuffer");
        images.push({
          fileName: `word/media/${path}`,
          mimeType: this.getMimeType(path),
          data,
          articleIndex: 0,
          position: 0,
        });
      }
    }

    return images;
  }

  private getMimeType(fileName: string): string {
    const ext = fileName.toLowerCase().split(".").pop();
    switch (ext) {
      case "jpeg":
      case "jpg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      default:
        return "application/octet-stream";
    }
  }

  private splitArticles(
    paragraphs: any[],
    allImages: EmbeddedImage[],
  ): DocxArticle[] {
    const articles: DocxArticle[] = [];
    let currentArticle: DocxArticle | null = null;
    let articleIndex = 0;
    let imageCounter = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const text = this.extractParagraphText(p);

      // 检查是否是文章标题（以"N."开头）
      const titleMatch = text.match(/^(\d+)\.\s*(.+)/);
      if (titleMatch) {
        // 保存上一篇文章
        if (currentArticle) {
          articles.push(currentArticle);
        }

        // 开始新文章
        articleIndex++;
        currentArticle = {
          index: articleIndex,
          title: titleMatch[2].trim(),
          body: [],
          images: [],
        };
      } else if (currentArticle) {
        // 添加到当前文章
        if (text.trim()) {
          currentArticle.body.push(text);
        }

        // 检查是否有图片
        if (this.hasImage(p)) {
          const image = allImages[imageCounter];
          if (image) {
            image.articleIndex = articleIndex;
            image.position = currentArticle.body.length;
            currentArticle.images.push(image);
            imageCounter++;
          }
        }
      }
    }

    // 保存最后一篇文章
    if (currentArticle) {
      articles.push(currentArticle);
    }

    return articles;
  }

  private extractParagraphText(p: any): string {
    if (!p || !p["w:r"]) return "";

    const runs = Array.isArray(p["w:r"]) ? p["w:r"] : [p["w:r"]];
    return runs
      .map((r: any) => {
        const t = r["w:t"];
        if (!t && t !== 0) return "";
        if (typeof t === "object") {
          // 处理 {"#text": "..."} 格式
          if (t["#text"] !== undefined) {
            return String(t["#text"]);
          }
          // 处理 {"@_xml:space":"preserve"} 等属性对象，跳过
          return "";
        }
        return String(t);
      })
      .join("");
  }

  private hasImage(p: any): boolean {
    if (!p || !p["w:r"]) return false;

    const runs = Array.isArray(p["w:r"]) ? p["w:r"] : [p["w:r"]];
    return runs.some((r: any) => r["w:drawing"]);
  }
}
