-- Add logo columns to markets table
ALTER TABLE markets ADD COLUMN IF NOT EXISTS home_logo text;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS away_logo text;
