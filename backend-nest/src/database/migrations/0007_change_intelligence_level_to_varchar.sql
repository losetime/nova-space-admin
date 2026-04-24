UPDATE intelligences SET level = 'basic' WHERE level = 'free';
ALTER TABLE intelligences ALTER COLUMN level TYPE varchar(50) USING level::varchar;
DROP TYPE IF EXISTS intelligence_level;
