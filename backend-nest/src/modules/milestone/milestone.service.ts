import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Milestone, MilestoneCategory } from './entities/milestone.entity';
import { CreateMilestoneDto, UpdateMilestoneDto, QueryMilestoneDto } from './dto/milestone.dto';

@Injectable()
export class MilestoneService {
  constructor(
    @InjectRepository(Milestone)
    private milestoneRepository: Repository<Milestone>,
  ) {}

  async findAll(query: QueryMilestoneDto) {
    const {
      page = 1,
      pageSize = 12,
      category,
      importance,
      isPublished,
      search,
      sortBy = 'eventDate',
      sortOrder = 'DESC',
    } = query;

    const qb = this.milestoneRepository.createQueryBuilder('milestone');

    if (category) {
      qb.andWhere('milestone.category = :category', { category });
    }

    if (importance) {
      qb.andWhere('milestone.importance = :importance', { importance });
    }

    if (isPublished !== undefined) {
      qb.andWhere('milestone.isPublished = :isPublished', { isPublished });
    }

    if (search) {
      qb.andWhere(
        '(milestone.title LIKE :search OR milestone.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy(`milestone.${sortBy}`, sortOrder)
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    const milestone = await this.milestoneRepository.findOne({ where: { id } });
    if (!milestone) {
      throw new NotFoundException('里程碑不存在');
    }
    return milestone;
  }

  async create(dto: CreateMilestoneDto) {
    const milestone = this.milestoneRepository.create({
      ...dto,
      eventDate: new Date(dto.eventDate),
    });
    return this.milestoneRepository.save(milestone);
  }

  async update(id: number, dto: UpdateMilestoneDto) {
    const milestone = await this.findOne(id);
    Object.assign(milestone, dto);
    if (dto.eventDate) {
      milestone.eventDate = new Date(dto.eventDate);
    }
    return this.milestoneRepository.save(milestone);
  }

  async remove(id: number) {
    const milestone = await this.findOne(id);
    await this.milestoneRepository.remove(milestone);
    return { message: '删除成功' };
  }

  async togglePublish(id: number) {
    const milestone = await this.findOne(id);
    milestone.isPublished = !milestone.isPublished;
    return this.milestoneRepository.save(milestone);
  }

  async getCategories() {
    const categories = await this.milestoneRepository
      .createQueryBuilder('milestone')
      .select('milestone.category', 'category')
      .addSelect('COUNT(milestone.id)', 'count')
      .groupBy('milestone.category')
      .getRawMany();

    return categories.map((c) => ({
      category: c.category as MilestoneCategory,
      count: parseInt(c.count),
    }));
  }
}