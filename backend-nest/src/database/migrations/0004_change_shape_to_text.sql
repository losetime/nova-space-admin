-- Migration: 0004_change_shape_to_text
-- Description: Change shape field from varchar(100) to text in satellite_metadata table

ALTER TABLE satellite_metadata ALTER COLUMN shape TYPE text;