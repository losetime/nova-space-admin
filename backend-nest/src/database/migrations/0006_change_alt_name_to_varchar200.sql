-- Migration: 0006_change_alt_name_to_varchar200
-- Description: Change alt_name field from varchar(100) to varchar(200)

ALTER TABLE satellite_metadata ALTER COLUMN alt_name TYPE varchar(200);