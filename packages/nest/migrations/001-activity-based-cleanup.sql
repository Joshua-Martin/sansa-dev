-- Migration: Activity-Based Cleanup System
-- Description: Updates workspace_sessions table to remove expiration-based cleanup
-- and add activity-based tracking fields

-- Check if workspace_sessions table exists before proceeding
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspace_sessions') THEN
        
        -- Create enum type for activity level if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_type
            WHERE typname IN ('activity_level_enum', 'workspace_sessions_activity_level_enum')
        ) THEN
            CREATE TYPE activity_level_enum AS ENUM ('active', 'idle', 'background', 'disconnected');
        END IF;

        -- Add new columns for activity-based cleanup (only if they don't exist)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_sessions' AND column_name = 'last_activity_at') THEN
            ALTER TABLE workspace_sessions ADD COLUMN last_activity_at TIMESTAMP WITH TIME ZONE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_sessions' AND column_name = 'activity_level') THEN
            ALTER TABLE workspace_sessions ADD COLUMN activity_level activity_level_enum NOT NULL DEFAULT 'active';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_sessions' AND column_name = 'active_connection_count') THEN
            ALTER TABLE workspace_sessions ADD COLUMN active_connection_count INTEGER NOT NULL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_sessions' AND column_name = 'grace_period_ends_at') THEN
            ALTER TABLE workspace_sessions ADD COLUMN grace_period_ends_at TIMESTAMP WITH TIME ZONE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_sessions' AND column_name = 'connection_metrics') THEN
            ALTER TABLE workspace_sessions ADD COLUMN connection_metrics JSONB;
        END IF;

        -- Create new indexes for activity-based queries
        CREATE INDEX IF NOT EXISTS idx_workspace_sessions_activity_level ON workspace_sessions(activity_level);
        CREATE INDEX IF NOT EXISTS idx_workspace_sessions_last_activity_at ON workspace_sessions(last_activity_at);

                -- Update existing records to have proper activity levels (only if they haven't been set)
        -- Set all running sessions to 'active'
        UPDATE workspace_sessions
        SET "activityLevel" = 'active',
          "lastActivityAt" = COALESCE("lastActivityAt", "createdAt"),
          "activeConnectionCount" = 0
        WHERE status IN ('creating', 'initializing', 'running')
          AND ("activityLevel" IS NULL OR "lastActivityAt" IS NULL);

        -- Set stopped sessions to 'disconnected'
        UPDATE workspace_sessions
        SET "activityLevel" = 'disconnected',
          "lastActivityAt" = COALESCE("lastActivityAt", "createdAt"),
          "activeConnectionCount" = 0
        WHERE status = 'stopped'
          AND ("activityLevel" IS NULL OR "lastActivityAt" IS NULL);

        -- Set error sessions to 'disconnected'
        UPDATE workspace_sessions
        SET "activityLevel" = 'disconnected',
          "lastActivityAt" = COALESCE("lastActivityAt", "createdAt"),
          "activeConnectionCount" = 0
        WHERE status = 'error'
          AND ("activityLevel" IS NULL OR "lastActivityAt" IS NULL);

        -- Remove old indexes that are no longer needed
        DROP INDEX IF EXISTS idx_workspace_sessions_expires_at;

        RAISE NOTICE 'Activity-based cleanup migration completed successfully';

    ELSE
        RAISE NOTICE 'workspace_sessions table does not exist, skipping migration';
    END IF;
END $$;

-- Note: Old columns (expires_at, last_accessed_at) can be removed in a future migration
-- after confirming the new system is working correctly
-- ALTER TABLE workspace_sessions DROP COLUMN IF EXISTS expires_at;
-- ALTER TABLE workspace_sessions DROP COLUMN IF EXISTS last_accessed_at;
