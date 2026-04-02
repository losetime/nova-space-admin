import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto, UpdateCompanyDto, QueryCompanyDto } from './dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async findAll(query: QueryCompanyDto) {
    const { page = 1, limit = 10, name, country } = query;
    const where: any = {};

    if (name) {
      where.name = Like(`%${name}%`);
    }
    if (country) {
      where.country = Like(`%${country}%`);
    }

    const [data, total] = await this.companyRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
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
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException('公司不存在');
    }
    return company;
  }

  async create(dto: CreateCompanyDto) {
    const company = this.companyRepository.create(dto);
    return this.companyRepository.save(company);
  }

  async update(id: number, dto: UpdateCompanyDto) {
    const company = await this.findOne(id);
    Object.assign(company, dto);
    return this.companyRepository.save(company);
  }

  async remove(id: number) {
    const company = await this.findOne(id);
    await this.companyRepository.remove(company);
  }

  async getStatistics() {
    const total = await this.companyRepository.count();

    const countries = await this.companyRepository
      .createQueryBuilder('company')
      .select('company.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .groupBy('company.country')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      total,
      countries,
    };
  }
}