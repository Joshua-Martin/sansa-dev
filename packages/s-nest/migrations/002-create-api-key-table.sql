-- Migration: Create api_key table
-- Description: Creates the api_key table for managing Sansa-X API keys
-- Date: 2025-10-06

-- Create api_key table if it doesn't exist
CREATE TABLE IF NOT EXISTS "api_key" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "key" VARCHAR(64) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "user_id" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP NULL,
    "lastUsedIp" VARCHAR(45) NULL,
    "lastUsedAt" TIMESTAMP NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT "FK_api_key_user" FOREIGN KEY ("user_id") 
        REFERENCES "user"("id") ON DELETE CASCADE,
    
    -- Unique constraint on key
    CONSTRAINT "UQ_api_key_key" UNIQUE ("key")
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "IDX_api_key_key" ON "api_key" ("key");
CREATE INDEX IF NOT EXISTS "IDX_api_key_user_id" ON "api_key" ("user_id");

-- Add trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_api_key_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "TR_api_key_updated_at" ON "api_key";
CREATE TRIGGER "TR_api_key_updated_at"
    BEFORE UPDATE ON "api_key"
    FOR EACH ROW
    EXECUTE FUNCTION update_api_key_updated_at();

-- Log success
DO $$
BEGIN
    RAISE NOTICE 'Created api_key table and indexes';
END $$;

