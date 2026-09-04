-- 为情报表添加英文字段，用于存储HW专报的英文版本
ALTER TABLE public.intelligences 
ADD COLUMN title_en character varying(255);

ALTER TABLE public.intelligences 
ADD COLUMN content_en text;
