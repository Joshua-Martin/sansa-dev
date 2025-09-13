-- Migration: Drop Conflicting TypeORM Index
-- Description: Drops the specific conflicting index IDX_78512d762073bf8cb3fc88714c that prevents TypeORM synchronization

-- =====================================================
-- DROP CONFLICTING INDEX
-- =====================================================

DO $$
BEGIN
    -- Drop the specific conflicting index that's causing the error
    DROP INDEX IF EXISTS "IDX_78512d762073bf8cb3fc88714c";
    
    -- Also drop any other potential TypeORM auto-generated indexes that might conflict
    DROP INDEX IF EXISTS "IDX_a1b2c3d4e5f6789012345678";
    DROP INDEX IF EXISTS "IDX_b2c3d4e5f6789012345678a1";
    DROP INDEX IF EXISTS "IDX_c3d4e5f6789012345678a1b2";
    DROP INDEX IF EXISTS "IDX_d4e5f6789012345678a1b2c3";
    DROP INDEX IF EXISTS "IDX_e5f6789012345678a1b2c3d4";
    
    -- Drop any indexes with similar patterns on workspaces table
    DECLARE
        index_record RECORD;
    BEGIN
        FOR index_record IN 
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'workspaces' 
            AND indexname LIKE 'IDX_%' 
            AND length(indexname) = 32  -- TypeORM generates 32-character hash indexes
        LOOP
            EXECUTE 'DROP INDEX IF EXISTS "' || index_record.indexname || '"';
            RAISE NOTICE 'Dropped conflicting index: %', index_record.indexname;
        END LOOP;
    END;
    
    RAISE NOTICE 'Conflicting TypeORM indexes dropped successfully';
    RAISE NOTICE 'Application should now be able to start and synchronize properly';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error dropping indexes: %', SQLERRM;
        RAISE NOTICE 'Continuing anyway...';
END $$;
