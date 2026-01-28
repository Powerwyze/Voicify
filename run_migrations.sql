-- Combined migrations for Powerwyze site
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/aqshisastebjacqoskvb/sql/new

-- Migration: 005_add_venue_background_image.sql
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS background_image_url TEXT DEFAULT NULL;

COMMENT ON COLUMN venues.background_image_url IS 'URL to background image for venue landing pages';

-- Migration: 006_setup_venue_images_storage.sql
-- Create venue-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'venue-images',
  'venue-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to venue-images bucket
CREATE POLICY IF NOT EXISTS "Public read access for venue images"
ON storage.objects FOR SELECT
USING (bucket_id = 'venue-images');

-- Allow authenticated users to upload venue images
CREATE POLICY IF NOT EXISTS "Authenticated users can upload venue images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'venue-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their venue images
CREATE POLICY IF NOT EXISTS "Authenticated users can update venue images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'venue-images' AND auth.role() = 'authenticated');

-- Migration: add_elevenlabs_agent_id.sql
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS elevenlabs_agent_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agents_elevenlabs_agent_id ON agents(elevenlabs_agent_id);

-- Add comment
COMMENT ON COLUMN agents.elevenlabs_agent_id IS 'ElevenLabs Conversational AI agent ID for real-time voice conversations';

-- Migration: 009_add_landing_spec.sql
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS landing_spec JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS landing_last_generated_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN agents.landing_spec IS 'JSON spec for custom landing page layout, content, and background';
COMMENT ON COLUMN agents.landing_last_generated_at IS 'Timestamp when landing page was last AI-generated';

-- Verify migrations
SELECT
  'elevenlabs_agent_id exists: ' || CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as result
FROM information_schema.columns
WHERE table_name = 'agents' AND column_name = 'elevenlabs_agent_id'
UNION ALL
SELECT
  'landing_spec exists: ' || CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END
FROM information_schema.columns
WHERE table_name = 'agents' AND column_name = 'landing_spec'
UNION ALL
SELECT
  'landing_last_generated_at exists: ' || CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END
FROM information_schema.columns
WHERE table_name = 'agents' AND column_name = 'landing_last_generated_at'
UNION ALL
SELECT
  'background_image_url exists: ' || CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END
FROM information_schema.columns
WHERE table_name = 'venues' AND column_name = 'background_image_url';
