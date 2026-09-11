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
        removeNSPrefix: true,
      });
      const doc = parser.parse(docXml);
      const body = doc["document"]["body"];

      // 读取 rId 到文件名的映射
      const ridToFile = await this.readRidMapping(zip);

      // 提取段落
      const paragraphs = body["p"] || [];
      const paragraphsArray = Array.isArray(paragraphs)
        ? paragraphs
        : [paragraphs];

      // 按"N."格式切分文章，并提取图片
      const { articles, allImages } = await this.splitArticles(
        paragraphsArray,
        zip,
        ridToFile,
      );

      return { articles, allImages };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`解析docx文件失败: ${error.message}`);
    }
  }

  /**
   * 从 word/_rels/document.xml.rels 读取 rId 到文件名的映射
   */
  private async readRidMapping(zip: JSZip): Promise<Map<string, string>> {
    const ridToFile = new Map<string, string>();
    const relsFile = zip.file("word/_rels/document.xml.rels");

    if (!relsFile) {
      return ridToFile;
    }

    const relsXml = await relsFile.async("string");
    const parser = new XMLParser({ ignoreAttributes: false });
    const relsDoc = parser.parse(relsXml);
    const relationships = relsDoc["Relationships"]["Relationship"];

    if (Array.isArray(relationships)) {
      for (const rel of relationships) {
        const target = rel["@_Target"];
        const id = rel["@_Id"];
        if (target && id && target.includes("media")) {
          ridToFile.set(id, target);
        }
      }
    }

    return ridToFile;
  }

  /**
   * 从段落中提取图片的 rId
   */
  private extractImageRid(p: any): string | null {
    if (!p || !p["r"]) return null;

    const runs = Array.isArray(p["r"]) ? p["r"] : [p["r"]];

    for (const r of runs) {
      if (!r["drawing"]) continue;

      const drawing = r["drawing"];
      // 尝试不同的图片嵌入路径
      const blip =
        drawing["inline"]?.["graphic"]?.["graphicData"]?.["pic"]?.[
          "blipFill"
        ]?.["blip"];

      if (blip) {
        // 支持两种属性名格式（带命名空间前缀和不带）
        return blip["@_r:embed"] || blip["@_embed"] || null;
      }
    }

    return null;
  }

  /**
   * 根据 rId 从 zip 中提取图片数据
   */
  private async extractImageByRid(
    zip: JSZip,
    rid: string,
    ridToFile: Map<string, string>,
  ): Promise<EmbeddedImage | null> {
    const target = ridToFile.get(rid);
    if (!target) return null;

    // target 格式: "media/image1.jpeg"
    const file = zip.file(`word/${target}`);
    if (!file) return null;

    const data = await file.async("nodebuffer");
    const fileName = target.split("/").pop() || "image.jpeg";

    return {
      fileName: `word/${target}`,
      mimeType: this.getMimeType(fileName),
      data,
      articleIndex: 0,
      position: 0,
    };
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

  private async splitArticles(
    paragraphs: any[],
    zip: JSZip,
    ridToFile: Map<string, string>,
  ): Promise<{ articles: DocxArticle[]; allImages: EmbeddedImage[] }> {
    const articles: DocxArticle[] = [];
    const allImages: EmbeddedImage[] = [];
    let currentArticle: DocxArticle | null = null;
    let articleIndex = 0;

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
        const rid = this.extractImageRid(p);
        if (rid) {
          const image = await this.extractImageByRid(zip, rid, ridToFile);
          if (image) {
            image.articleIndex = articleIndex;
            image.position = currentArticle.body.length;
            currentArticle.images.push(image);
            allImages.push(image);
          }
        }
      }
    }

    // 保存最后一篇文章
    if (currentArticle) {
      articles.push(currentArticle);
    }

    return { articles, allImages };
  }

  private extractParagraphText(p: any): string {
    if (!p || !p["r"]) return "";

    const runs = Array.isArray(p["r"]) ? p["r"] : [p["r"]];
    return runs
      .map((r: any) => {
        const t = r["t"];
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
    if (!p || !p["r"]) return false;

    const runs = Array.isArray(p["r"]) ? p["r"] : [p["r"]];
    return runs.some((r: any) => r["drawing"]);
  }
}
