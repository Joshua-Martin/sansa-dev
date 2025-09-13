-- Migration: Remove Expired Status from Workspace Sessions
-- Description: Updates workspace_sessions_status_enum to remove 'expired' value
-- and migrates any existing expired records to 'stopped'

DO $$
BEGIN
    -- Check if workspace_sessions table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspace_sessions') THEN
        
        -- First, update any existing records with 'expired' status to 'stopped'
        -- Only try this if the enum still contains 'expired' value
        IF EXISTS (
            SELECT 1 FROM pg_enum
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'workspace_sessions_status_enum')
            AND enumlabel = 'expired'
        ) THEN
            UPDATE workspace_sessions
            SET status = 'stopped'
            WHERE status = 'expired';
        END IF;

        -- Check if the enum still contains 'expired' value
        IF EXISTS (
            SELECT 1 FROM pg_enum
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'workspace_sessions_status_enum')
            AND enumlabel = 'expired'
        ) THEN
            -- Only proceed with enum modification if 'expired' still exists
            
            -- Create new enum type without 'expired' (only if it doesn't exist)
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspace_sessions_status_enum_new') THEN
                CREATE TYPE workspace_sessions_status_enum_new AS ENUM (
                    'creating', 
                    'initializing', 
                    'running', 
                    'stopping', 
                    'stopped', 
                    'error'
                );
            END IF;

            -- Remove the default constraint temporarily
            ALTER TABLE workspace_sessions 
                ALTER COLUMN status DROP DEFAULT;

            -- Update the table to use the new enum type
            ALTER TABLE workspace_sessions 
                ALTER COLUMN status TYPE workspace_sessions_status_enum_new 
                USING status::text::workspace_sessions_status_enum_new;

            -- Add the default back
            ALTER TABLE workspace_sessions 
                ALTER COLUMN status SET DEFAULT 'creating'::workspace_sessions_status_enum_new;

            -- Drop the old enum type
            DROP TYPE workspace_sessions_status_enum;

            -- Rename the new enum type to the original name
            ALTER TYPE workspace_sessions_status_enum_new RENAME TO workspace_sessions_status_enum;
            
            RAISE NOTICE 'Expired status removal migration completed successfully';
        ELSE
            RAISE NOTICE 'Expired status not found in enum, migration already applied';
        END IF;

    ELSE
        RAISE NOTICE 'workspace_sessions table does not exist, skipping migration';
    END IF;
END $$;
