# Database Migrations

This directory contains SQL migration files for the database schema.

## Running Migrations

To run all migrations in sequence:

```bash
cd packages/nest
npm run db:migrate
```

Or directly:

```bash
node run-migration.js
```

## Migration Files

Migrations are executed in alphabetical/numerical order based on filename. Use the format:

```
001-description-of-change.sql
002-another-change.sql
003-yet-another-change.sql
```

### Current Migrations

-none

## Environment Variables

The migration runner uses these environment variables (with defaults):

- `POSTGRES_HOST` (default: 'db')
- `POSTGRES_PORT` (default: 5432)
- `POSTGRES_USERNAME` (default: 'postgres')
- `POSTGRES_PASSWORD` (default: 'A79Vm5D4p2VQHOp2gd5')
- `POSTGRES_DATABASE` (default: 'sansa-dev')

## Creating New Migrations

1. Create a new file with the next number in sequence: `00X-description.sql`
2. Write idempotent SQL using `IF NOT EXISTS` and `IF EXISTS` checks
3. Test the migration on a development database first
4. Create a corresponding rollback file: `ROLLBACK-00X-description.sql`
5. Document the changes in this README

## Migration Best Practices

1. **Always be idempotent**: Use `IF NOT EXISTS` / `IF EXISTS` checks so migrations can be run multiple times safely
2. **Test data migration**: Verify existing data is properly migrated to new columns
3. **Preserve data**: Never drop columns without first migrating their data
4. **Use transactions**: Wrap complex migrations in transactions (already handled by the runner)
5. **Document changes**: Add comments explaining what the migration does and why