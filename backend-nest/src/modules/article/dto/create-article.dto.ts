import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsInt, IsArray } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty({ message: '标题不能为空' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  cover?: string;

  @IsEnum(['basic', 'advanced', 'mission', 'people'], { message: '分类不正确' })
  @IsNotEmpty({ message: '分类不能为空' })
  category: string;

  @IsEnum(['article', 'video'])
  @IsOptional()
  type?: string;

  @IsInt()
  @IsOptional()
  duration?: number;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

export class UpdateArticleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  cover?: string;

  @IsEnum(['basic', 'advanced', 'mission', 'people'])
  @IsOptional()
  category?: string;

  @IsEnum(['article', 'video'])
  @IsOptional()
  type?: string;

  @IsInt()
  @IsOptional()
  duration?: number;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

export class QueryArticleDto {
  page?: number = 1;
  limit?: number = 10;
  category?: string;
  keyword?: string;
  isPublished?: boolean;
}