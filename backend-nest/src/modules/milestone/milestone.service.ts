import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, like, desc, asc, and, or, sql, SQL } from 'drizzle-orm';
import { Database } from '../../database';
import { milestones } from '../../database/schema/milestones';
import { CreateMilestoneDto, UpdateMilestoneDto, QueryMilestoneDto } from './dto/milestone.dto';

type MilestoneCategoryType = 'launch' | 'recovery' | 'orbit' | 'mission' | 'other';

const sortByMap: Record<string, any> = {
  event_date: milestones.event_date,
  eventDate: milestones.event_date,
  created_at: milestones.created_at,
  createdAt: milestones.created_at,
  importance: milestones.importance,
};

@Injectable()
export class MilestoneService {
  constructor(@Inject('DATABASE') private db: Database) {}

  async findAll(query: QueryMilestoneDto) {
    const {
      page = 1,
      pageSize = 12,
      category,
      importance,
      isPublished,
      search,
      sortBy = 'event_date',
      sortOrder = 'DESC',
    } = query;

    const conditions: SQL[] = [];
    if (category) {
      conditions.push(eq(milestones.category, category as MilestoneCategoryType));
    }
    if (importance) {
      conditions.push(eq(milestones.importance, importance));
    }
    if (isPublished !== undefined) {
      conditions.push(eq(milestones.is_published, isPublished));
    }
    if (search) {
      conditions.push(or(like(milestones.title, `%${search}%`), like(milestones.description, `%${search}%`))!);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = sortByMap[sortBy] || milestones.event_date;
    const orderByClause = sortOrder === 'DESC' ? desc(sortColumn) : asc(sortColumn);

    const data = await this.db
      .select()
      .from(milestones)
      .where(whereClause)
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .orderBy(orderByClause);

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(milestones)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    const milestone = await this.db.select().from(milestones).where(eq(milestones.id, id)).limit(1);
    if (!milestone[0]) {
      throw new NotFoundException('里程碑不存在');
    }
    return milestone[0];
  }

  async create(dto: CreateMilestoneDto) {
    const result = await this.db
      .insert(milestones)
      .values({
        title: dto.title,
        description: dto.description,
        content: dto.content,
        event_date: new Date(dto.eventDate),
        category: dto.category as MilestoneCategoryType,
        cover: dto.cover,
        media: dto.media,
        related_satellite_norad_id: dto.relatedSatelliteNoradId,
        importance: dto.importance,
        location: dto.location,
        organizer: dto.organizer,
        is_published: dto.isPublished ?? true,
      } as any)
      .returning();
    return result[0];
  }

  async update(id: number, dto: UpdateMilestoneDto) {
    await this.findOne(id);
    const updateData: any = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.description) updateData.description = dto.description;
    if (dto.content) updateData.content = dto.content;
    if (dto.eventDate) updateData.event_date = new Date(dto.eventDate);
    if (dto.category) updateData.category = dto.category;
    if (dto.cover) updateData.cover = dto.cover;
    if (dto.media) updateData.media = dto.media;
    if (dto.relatedSatelliteNoradId) updateData.related_satellite_norad_id = dto.relatedSatelliteNoradId;
    if (dto.importance) updateData.importance = dto.importance;
    if (dto.location) updateData.location = dto.location;
    if (dto.organizer) updateData.organizer = dto.organizer;
    if (dto.isPublished !== undefined) updateData.is_published = dto.isPublished;

    const result = await this.db.update(milestones).set(updateData).where(eq(milestones.id, id)).returning();
    return result[0];
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.delete(milestones).where(eq(milestones.id, id));
    return { message: '删除成功' };
  }

  async togglePublish(id: number) {
    const milestone = await this.findOne(id);
    const result = await this.db
      .update(milestones)
      .set({ is_published: !milestone.is_published })
      .where(eq(milestones.id, id))
      .returning();
    return result[0];
  }

  async getCategories() {
    const categories = await this.db
      .select({
        category: milestones.category,
        count: sql<number>`count(*)`,
      })
      .from(milestones)
      .groupBy(milestones.category);

    return categories.map((c) => ({
      category: c.category,
      count: Number(c.count),
    }));
  }
}