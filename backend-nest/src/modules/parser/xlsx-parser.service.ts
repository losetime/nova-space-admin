import { Injectable, BadRequestException } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import { TrackingRecord } from "./parser.types";

@Injectable()
export class XlsxParserService {
  async parse(buffer: Buffer): Promise<TrackingRecord[]> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new BadRequestException("Excel文件中没有工作表");
      }

      const records: TrackingRecord[] = [];
      const rowCount = worksheet.rowCount;

      // 数据行从第4行开始（跳过标题行、日期行、表头行）
      for (let i = 4; i <= Math.min(rowCount, 13); i++) {
        const row = worksheet.getRow(i);

        const id = row.getCell(1).value as number;
        if (!id) continue;

        const titleEn = this.safeString(row.getCell(2).value);
        const titleCn = this.safeString(row.getCell(3).value);
        const source = this.safeString(row.getCell(4).value);
        const publishTime = this.normalizeDate(row.getCell(5).value);
        const url = this.safeString(row.getCell(6).value);

        if (titleEn && titleCn) {
          records.push({
            id,
            titleEn,
            titleCn,
            source,
            publishTime,
            url,
          });
        }
      }

      return records;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`解析Excel文件失败: ${error.message}`);
    }
  }

  private safeString(value: any): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    if (typeof value === "object") {
      // 处理Excel超链接格式 { text: "...", hyperlink: "..." }
      if (value.text !== undefined) return String(value.text).trim();
      if (value.hyperlink !== undefined) return String(value.hyperlink).trim();
      if (value.result !== undefined) return String(value.result).trim();
      return JSON.stringify(value);
    }
    return String(value).trim();
  }

  private normalizeDate(value: any): Date | null {
    if (!value) return null;

    // 处理Excel日期序列号
    if (typeof value === "number") {
      // Excel日期序列号转换为JavaScript日期
      // Excel的日期从1900年1月1日开始，需要减去25569（1970年1月1日的Excel序列号）
      const jsDate = new Date((value - 25569) * 86400 * 1000);
      return jsDate;
    }

    // 处理日期对象
    if (value instanceof Date) {
      return value;
    }

    // 处理字符串格式的日期
    if (typeof value === "string") {
      // 尝试解析ISO格式
      if (value.includes("T")) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // 尝试解析普通日期格式
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  }
}
