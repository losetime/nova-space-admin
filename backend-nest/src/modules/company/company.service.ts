import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, like, desc, and, sql } from 'drizzle-orm';
import { Database } from '../../database';
import { companies } from '../../database/schema/companies';
import { CreateCompanyDto, UpdateCompanyDto, QueryCompanyDto } from './dto';

@Injectable()
export class CompanyService {
  constructor(@Inject('DATABASE') private db: Database) {}

  async findAll(query: QueryCompanyDto) {
    const { page = 1, limit = 10, name, country } = query;

    const conditions = [];
    if (name) {
      conditions.push(like(companies.name, `%${name}%`));
    }
    if (country) {
      conditions.push(like(companies.country, `%${country}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await this.db
      .select()
      .from(companies)
      .where(whereClause)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(companies.created_at));

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(companies)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const company = await this.db.select().from(companies).where(eq(companies.id, id)).limit(1);
    if (!company[0]) {
      throw new NotFoundException('公司不存在');
    }
    return company[0];
  }

  async create(dto: CreateCompanyDto) {
    const result = await this.db.insert(companies).values(dto).returning();
    return result[0];
  }

  async update(id: number, dto: UpdateCompanyDto) {
    await this.findOne(id);
    const result = await this.db.update(companies).set(dto).where(eq(companies.id, id)).returning();
    return result[0];
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.delete(companies).where(eq(companies.id, id));
  }

  async getStatistics() {
    const countResult = await this.db.select({ count: sql<number>`count(*)` }).from(companies);
    const total = Number(countResult[0]?.count || 0);

    const countries = await this.db
      .select({
        country: companies.country,
        count: sql<number>`count(*)`,
      })
      .from(companies)
      .groupBy(companies.country)
      .orderBy(sql`count(*) DESC`);

    return {
      total,
      countries,
    };
  }
}