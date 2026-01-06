-- Add background image URL to venues table
-- This will be used as the landing page background for all agents in this venue

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS background_image_url TEXT DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN venues.background_image_url IS 'Background image URL for landing pages of agents in this venue (museum/event)';
