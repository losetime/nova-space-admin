import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { eq, like, desc, and, sql, SQL } from "drizzle-orm";
import type { Database } from "../../database";
import { articles } from "../../database/schema/articles";
import { CreateArticleDto, UpdateArticleDto, QueryArticleDto } from "./dto";

type ArticleCategory = "basic" | "advanced" | "mission" | "people";
type ArticleType = "article" | "video";

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) return parsed;
    return [tags];
  } catch {
    return [tags];
  }
}

@Injectable()
export class ArticleService {
  constructor(@Inject("DATABASE") private db: Database) {}

  async findAll(query: QueryArticleDto) {
    const { page = 1, limit = 10, category, keyword, isPublished } = query;

    const conditions: SQL[] = [];
    if (category) {
      conditions.push(eq(articles.category, category as ArticleCategory));
    }
    if (keyword) {
      conditions.push(like(articles.title, `%${keyword}%`));
    }
    if (isPublished !== undefined) {
      conditions.push(eq(articles.isPublished, isPublished));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await this.db
      .select()
      .from(articles)
      .where(whereClause)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(articles.createdAt));

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
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
    const article = await this.db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);
    if (!article[0]) {
      throw new NotFoundException("文章不存在");
    }
    return {
      ...article[0],
      tags: parseTags(article[0].tags),
    };
  }

  private mapDtoToSchema(dto: CreateArticleDto | UpdateArticleDto) {
    return {
      title: dto.title,
      content: dto.content,
      summary: dto.summary,
      cover: dto.cover,
      category: dto.category as ArticleCategory,
      type: dto.type as ArticleType,
      duration: dto.duration,
      tags: dto.tags ? JSON.stringify(dto.tags) : undefined,
      isPublished: dto.isPublished,
    };
  }

  async create(dto: CreateArticleDto) {
    const values = this.mapDtoToSchema(dto);
    const result = await this.db
      .insert(articles)
      .values(values as any)
      .returning();
    const article = result[0];
    return {
      ...article,
      tags: parseTags(article.tags),
    };
  }

  async update(id: number, dto: UpdateArticleDto) {
    await this.findOne(id);
    const values = this.mapDtoToSchema(dto);
    const result = await this.db
      .update(articles)
      .set(values as any)
      .where(eq(articles.id, id))
      .returning();
    const article = result[0];
    return {
      ...article,
      tags: parseTags(article.tags),
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.delete(articles).where(eq(articles.id, id));
    return { message: "删除成功" };
  }

  async batchCreate(articlesData: Partial<typeof articles.$inferInsert>[]) {
    return this.db
      .insert(articles)
      .values(articlesData as any)
      .returning();
  }
}
