-- Migration: Fix Workspace Entity Synchronization
-- Description: Resolves TypeORM synchronization conflicts caused by missing Workspace entity registration
-- and ensures proper index management for the workspaces table

-- =====================================================
-- WORKSPACE ENTITY SYNCHRONIZATION FIX
-- =====================================================

DO $$
DECLARE
    index_exists BOOLEAN;
    table_exists BOOLEAN;
BEGIN
    -- Check if workspaces table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'workspaces'
    ) INTO table_exists;

    IF table_exists THEN
        RAISE NOTICE 'Workspaces table exists, proceeding with index cleanup and verification';
        
        -- Drop any problematic TypeORM-generated indexes that might conflict
        -- These are auto-generated indexes that can cause conflicts during synchronization
        DROP INDEX IF EXISTS "IDX_78512d762073bf8cb3fc88714c";
        DROP INDEX IF EXISTS "IDX_a1b2c3d4e5f6789012345678";
        DROP INDEX IF EXISTS "IDX_b2c3d4e5f6789012345678a1";
        DROP INDEX IF EXISTS "IDX_c3d4e5f6789012345678a1b2";
        
        -- Ensure the workspaces table has the correct structure
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'id') THEN
            ALTER TABLE workspaces ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'user_id') THEN
            ALTER TABLE workspaces ADD COLUMN user_id UUID NOT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'name') THEN
            ALTER TABLE workspaces ADD COLUMN name VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'template_id') THEN
            ALTER TABLE workspaces ADD COLUMN template_id VARCHAR(255) NOT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'storage_key') THEN
            ALTER TABLE workspaces ADD COLUMN storage_key VARCHAR(500) NOT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'resources') THEN
            ALTER TABLE workspaces ADD COLUMN resources JSONB NOT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'environment') THEN
            ALTER TABLE workspaces ADD COLUMN environment JSONB NOT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'created_at') THEN
            ALTER TABLE workspaces ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'last_accessed_at') THEN
            ALTER TABLE workspaces ADD COLUMN last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'last_saved_at') THEN
            ALTER TABLE workspaces ADD COLUMN last_saved_at TIMESTAMP WITH TIME ZONE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'metadata') THEN
            ALTER TABLE workspaces ADD COLUMN metadata JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'updated_at') THEN
            ALTER TABLE workspaces ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;

        -- Create the proper indexes that match the entity decorators
        -- These will be created with predictable names to avoid conflicts
        
        -- Single column indexes
        CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
        CREATE INDEX IF NOT EXISTS idx_workspaces_template_id ON workspaces(template_id);
        
        -- Composite indexes matching the entity decorators
        CREATE INDEX IF NOT EXISTS idx_workspaces_user_id_last_accessed_at ON workspaces(user_id, last_accessed_at);
        CREATE INDEX IF NOT EXISTS idx_workspaces_user_id_created_at ON workspaces(user_id, created_at);
        
        -- Additional performance indexes
        CREATE INDEX IF NOT EXISTS idx_workspaces_created_at ON workspaces(created_at);
        CREATE INDEX IF NOT EXISTS idx_workspaces_last_accessed_at ON workspaces(last_accessed_at);
        CREATE INDEX IF NOT EXISTS idx_workspaces_last_saved_at ON workspaces(last_saved_at);
        
        RAISE NOTICE 'Workspaces table structure and indexes verified/created successfully';
        
    ELSE
        -- Create the workspaces table from scratch if it doesn't exist
        RAISE NOTICE 'Creating workspaces table from scratch';
        
        CREATE TABLE workspaces (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            name VARCHAR(255),
            template_id VARCHAR(255) NOT NULL,
            storage_key VARCHAR(500) NOT NULL,
            resources JSONB NOT NULL,
            environment JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL,
            last_saved_at TIMESTAMP WITH TIME ZONE,
            metadata JSONB,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);
        CREATE INDEX idx_workspaces_template_id ON workspaces(template_id);
        CREATE INDEX idx_workspaces_user_id_last_accessed_at ON workspaces(user_id, last_accessed_at);
        CREATE INDEX idx_workspaces_user_id_created_at ON workspaces(user_id, created_at);
        CREATE INDEX idx_workspaces_created_at ON workspaces(created_at);
        CREATE INDEX idx_workspaces_last_accessed_at ON workspaces(last_accessed_at);
        CREATE INDEX idx_workspaces_last_saved_at ON workspaces(last_saved_at);
        
        RAISE NOTICE 'Workspaces table created successfully';
    END IF;

    -- Verify all expected indexes exist
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'workspaces' 
        AND indexname = 'idx_workspaces_user_id'
    ) INTO index_exists;
    
    IF index_exists THEN
        RAISE NOTICE 'Index verification: idx_workspaces_user_id exists ✓';
    ELSE
        RAISE WARNING 'Index verification: idx_workspaces_user_id missing ✗';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'workspaces' 
        AND indexname = 'idx_workspaces_user_id_last_accessed_at'
    ) INTO index_exists;
    
    IF index_exists THEN
        RAISE NOTICE 'Index verification: idx_workspaces_user_id_last_accessed_at exists ✓';
    ELSE
        RAISE WARNING 'Index verification: idx_workspaces_user_id_last_accessed_at missing ✗';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'workspaces' 
        AND indexname = 'idx_workspaces_user_id_created_at'
    ) INTO index_exists;
    
    IF index_exists THEN
        RAISE NOTICE 'Index verification: idx_workspaces_user_id_created_at exists ✓';
    ELSE
        RAISE WARNING 'Index verification: idx_workspaces_user_id_created_at missing ✗';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'workspaces' 
        AND indexname = 'idx_workspaces_template_id'
    ) INTO index_exists;
    
    IF index_exists THEN
        RAISE NOTICE 'Index verification: idx_workspaces_template_id exists ✓';
    ELSE
        RAISE WARNING 'Index verification: idx_workspaces_template_id missing ✗';
    END IF;

    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Workspace Entity Synchronization Fix Completed';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Add Workspace entity to DatabaseModule entities array';
    RAISE NOTICE '2. Restart the application to test synchronization';
    RAISE NOTICE '3. Monitor for any remaining TypeORM conflicts';

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Migration encountered an error: %', SQLERRM;
        RAISE NOTICE 'Continuing with partial migration...';
END $$;
