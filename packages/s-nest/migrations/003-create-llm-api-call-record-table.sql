-- Migration: Create llm_api_call_record table
-- Description: Creates the llm_api_call_record table for storing Sansa-X monitoring data
-- Date: 2025-10-06

-- Create llm_api_call_record table if it doesn't exist
CREATE TABLE IF NOT EXISTS "llm_api_call_record" (
    "id" VARCHAR(128) PRIMARY KEY,
    "appId" VARCHAR(36) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "promptVersion" VARCHAR(128) NOT NULL,
    "prompt" TEXT NULL,
    "systemPrompt" TEXT NULL,
    "model" VARCHAR(50) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "inputTokenCount" INTEGER NULL,
    "outputTokenCount" INTEGER NULL,
    "response" TEXT NULL,
    "requestTimestamp" TIMESTAMP NOT NULL,
    "responseTimestamp" TIMESTAMP NOT NULL,
    "durationMs" INTEGER NULL,
    "error" JSONB NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS "IDX_llm_api_call_record_appId" ON "llm_api_call_record" ("appId");
CREATE INDEX IF NOT EXISTS "IDX_llm_api_call_record_name" ON "llm_api_call_record" ("name");
CREATE INDEX IF NOT EXISTS "IDX_llm_api_call_record_promptVersion" ON "llm_api_call_record" ("promptVersion");
CREATE INDEX IF NOT EXISTS "IDX_llm_api_call_record_model" ON "llm_api_call_record" ("model");
CREATE INDEX IF NOT EXISTS "IDX_llm_api_call_record_provider" ON "llm_api_call_record" ("provider");
CREATE INDEX IF NOT EXISTS "IDX_llm_api_call_record_requestTimestamp" ON "llm_api_call_record" ("requestTimestamp");
CREATE INDEX IF NOT EXISTS "IDX_llm_api_call_record_appId_name" ON "llm_api_call_record" ("appId", "name");
CREATE INDEX IF NOT EXISTS "IDX_llm_api_call_record_appId_requestTimestamp" ON "llm_api_call_record" ("appId", "requestTimestamp" DESC);

-- Add trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_llm_api_call_record_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "TR_llm_api_call_record_updated_at" ON "llm_api_call_record";
CREATE TRIGGER "TR_llm_api_call_record_updated_at"
    BEFORE UPDATE ON "llm_api_call_record"
    FOR EACH ROW
    EXECUTE FUNCTION update_llm_api_call_record_updated_at();

-- Log success
DO $$
BEGIN
    RAISE NOTICE 'Created llm_api_call_record table and indexes';
END $$;

