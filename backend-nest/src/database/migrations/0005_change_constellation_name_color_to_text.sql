-- Migration: 0005_change_constellation_name_color_to_text
-- Description: Change constellation_name and color fields from varchar(100) to text

ALTER TABLE satellite_metadata ALTER COLUMN constellation_name TYPE text;
ALTER TABLE satellite_metadata ALTER COLUMN color TYPE text;