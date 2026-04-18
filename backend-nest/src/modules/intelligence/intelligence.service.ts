import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { eq, like, desc, and, sql, SQL } from "drizzle-orm";
import type { Database } from "../../database";
import { intelligences } from "../../database/schema/intelligences";
import {
  CreateIntelligenceDto,
  UpdateIntelligenceDto,
  QueryIntelligenceDto,
} from "./dto";

type IntelligenceCategoryType =
  | "launch"
  | "satellite"
  | "industry"
  | "research"
  | "environment";
type IntelligenceLevelType = "free" | "advanced" | "professional";

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags.split(',').map((t) => t.trim()).filter(Boolean);
}

@Injectable()
export class IntelligenceService {
  constructor(@Inject("DATABASE") private db: Database) {}

  async findAll(query: QueryIntelligenceDto) {
    const { page = 1, limit = 10, category, level, keyword } = query;

    const conditions: SQL[] = [];
    if (category) {
      conditions.push(
        eq(intelligences.category, category as IntelligenceCategoryType),
      );
    }
    if (level) {
      conditions.push(eq(intelligences.level, level as IntelligenceLevelType));
    }
    if (keyword) {
      conditions.push(like(intelligences.title, `%${keyword}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await this.db
      .select()
      .from(intelligences)
      .where(whereClause)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(intelligences.createdAt));

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(intelligences)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    return {
      data: data.map((item) => ({
        ...item,
        tags: parseTags(item.tags),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const intelligence = await this.db
      .select()
      .from(intelligences)
      .where(eq(intelligences.id, id))
      .limit(1);
    if (!intelligence[0]) {
      throw new NotFoundException("情报不存在");
    }
    return {
      ...intelligence[0],
      tags: parseTags(intelligence[0].tags),
    };
  }

  private mapDtoToSchema(dto: CreateIntelligenceDto | UpdateIntelligenceDto) {
    return {
      title: dto.title,
      content: dto.content,
      summary: dto.summary,
      cover: dto.cover,
      category: dto.category,
      level: dto.level,
      source: dto.source,
      sourceUrl: dto.sourceUrl,
      tags: dto.tags || undefined,
      analysis: dto.analysis,
      trend: dto.trend,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
    };
  }

  async create(dto: CreateIntelligenceDto) {
    const values = this.mapDtoToSchema(dto);
    const result = await this.db
      .insert(intelligences)
      .values(values as any)
      .returning();
    const intelligence = result[0];
    return {
      ...intelligence,
      tags: parseTags(intelligence.tags),
    };
  }

  async update(id: number, dto: UpdateIntelligenceDto) {
    await this.findOne(id);
    const values = this.mapDtoToSchema(dto);
    const result = await this.db
      .update(intelligences)
      .set(values as any)
      .where(eq(intelligences.id, id))
      .returning();
    const intelligence = result[0];
    return {
      ...intelligence,
      tags: parseTags(intelligence.tags),
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.delete(intelligences).where(eq(intelligences.id, id));
    return { message: "删除成功" };
  }

  async batchCreate(intelligencesData: any[]) {
    return this.db.insert(intelligences).values(intelligencesData).returning();
  }
}
