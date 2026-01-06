-- Add voice_platform column to agents table
-- This allows selecting between 'vapi' and 'elevenlabs' as the voice provider

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS voice_platform TEXT DEFAULT 'elevenlabs'
CHECK (voice_platform IN ('vapi', 'elevenlabs'));

-- Add comment for documentation
COMMENT ON COLUMN agents.voice_platform IS 'Voice AI platform to use: vapi or elevenlabs';

