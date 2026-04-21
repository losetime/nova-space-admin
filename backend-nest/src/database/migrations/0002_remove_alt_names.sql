-- Migration: Remove alt_names column, migrate data to alt_name
-- Description: Consolidate alt_names array field into single alt_name field
-- Date: 2026-04-21

-- Step 1: Migrate data from alt_names to alt_name
-- If alt_name is empty/null and alt_names has value, copy alt_names to alt_name
-- Handle both JSON array format (e.g., '["TIROS-D"]') and plain string format
UPDATE "satellite_metadata"
SET alt_name = CASE
    WHEN alt_names LIKE '%[%' THEN REPLACE(REPLACE(alt_names, '[', ''), ']', '')
    ELSE alt_names
  END
WHERE (alt_name IS NULL OR alt_name = '')
  AND alt_names IS NOT NULL
  AND alt_names != '';

--> statement-breakpoint

-- Step 2: Drop the alt_names column
ALTER TABLE "satellite_metadata" DROP COLUMN IF EXISTS "alt_names";
