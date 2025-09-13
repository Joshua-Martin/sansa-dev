-- Migration: Workspace Persistence System
-- Description: Adds persistence-related columns to workspace_sessions table for save/restore functionality

-- Check if workspace_sessions table exists before proceeding
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspace_sessions') THEN

        -- Add new columns for workspace persistence (only if they don't exist)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_sessions' AND column_name = 'has_saved_changes') THEN
            ALTER TABLE workspace_sessions ADD COLUMN has_saved_changes BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_sessions' AND column_name = 'last_saved_at') THEN
            ALTER TABLE workspace_sessions ADD COLUMN last_saved_at TIMESTAMP WITH TIME ZONE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_sessions' AND column_name = 'template_id') THEN
            ALTER TABLE workspace_sessions ADD COLUMN template_id VARCHAR(255);
        END IF;

        -- Create indexes for performance (only if they don't exist)
        CREATE INDEX IF NOT EXISTS idx_workspace_sessions_has_saved_changes ON workspace_sessions(has_saved_changes);
        CREATE INDEX IF NOT EXISTS idx_workspace_sessions_last_saved_at ON workspace_sessions(last_saved_at);

        RAISE NOTICE 'Workspace persistence migration completed successfully';

    ELSE
        RAISE NOTICE 'workspace_sessions table does not exist, skipping migration';
    END IF;
END $$;
