import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Article } from './entities/article.entity';
import { CreateArticleDto, UpdateArticleDto, QueryArticleDto } from './dto';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  async findAll(query: QueryArticleDto) {
    const { page = 1, limit = 10, category, keyword, isPublished } = query;

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (keyword) {
      where.title = Like(`%${keyword}%`);
    }
    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    const [data, total] = await this.articleRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('文章不存在');
    }
    return article;
  }

  async create(dto: CreateArticleDto) {
    const article = this.articleRepository.create(dto);
    return this.articleRepository.save(article);
  }

  async update(id: number, dto: UpdateArticleDto) {
    const article = await this.findOne(id);
    Object.assign(article, dto);
    return this.articleRepository.save(article);
  }

  async remove(id: number) {
    const article = await this.findOne(id);
    await this.articleRepository.remove(article);
    return { message: '删除成功' };
  }

  async batchCreate(articles: Partial<Article>[]) {
    const created = this.articleRepository.create(articles);
    return this.articleRepository.save(created);
  }
}