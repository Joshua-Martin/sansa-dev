-- Migration: Add appId to users table
-- Description: Adds a unique appId field to the user table for API key association and multi-tenant tracking
-- Date: 2025-10-06

-- Add appId column to user table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user' AND column_name = 'appId'
    ) THEN
        -- Add the column
        ALTER TABLE "user" ADD COLUMN "appId" VARCHAR(36);
        
        -- Generate UUIDs for existing users
        UPDATE "user" SET "appId" = gen_random_uuid()::text WHERE "appId" IS NULL;
        
        -- Make it NOT NULL after populating
        ALTER TABLE "user" ALTER COLUMN "appId" SET NOT NULL;
        
        -- Add unique constraint
        ALTER TABLE "user" ADD CONSTRAINT "UQ_user_appId" UNIQUE ("appId");
        
        -- Add index for faster lookups
        CREATE INDEX IF NOT EXISTS "IDX_user_appId" ON "user" ("appId");
        
        RAISE NOTICE 'Added appId column to user table';
    ELSE
        RAISE NOTICE 'appId column already exists in user table';
    END IF;
END $$;

