-- Migration: Add fixture_id to markets for robust matching
ALTER TABLE public.markets
ADD COLUMN IF NOT EXISTS fixture_id INTEGER;

-- Create an index for faster lookups during resolution
CREATE INDEX IF NOT EXISTS idx_markets_fixture_id ON public.markets(fixture_id);
