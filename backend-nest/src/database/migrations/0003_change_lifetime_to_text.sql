-- Migration: 0003_change_lifetime_to_text
-- Description: Change lifetime field from varchar(100) to text in satellite_metadata table

ALTER TABLE satellite_metadata ALTER COLUMN lifetime TYPE text;