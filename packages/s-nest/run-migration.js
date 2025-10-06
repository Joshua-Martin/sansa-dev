#!/usr/bin/env node

/**
 * Simple migration runner script
 * This script runs database migrations in sequence
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  // Database configuration from environment variables (S Backend specific)
  const client = new Client({
    host: process.env.S_POSTGRES_HOST || 's-db',
    port: process.env.S_POSTGRES_PORT || 5432,
    user: process.env.S_POSTGRES_USERNAME || 'postgres',
    password: process.env.S_POSTGRES_PASSWORD || 'dev-pw',
    database: process.env.S_POSTGRES_DATABASE || 's-sansa-dev',
  });

  try {
    console.log('Connecting to database...');
    await client.connect();

    // Get all migration files in order
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort(); // This will sort them numerically: 001, 002, 003, etc.

    console.log(`Found ${migrationFiles.length} migration files to run`);

    for (const migrationFile of migrationFiles) {
      const migrationPath = path.join(migrationsDir, migrationFile);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      console.log(`Running migration: ${migrationFile}...`);
      await client.query(migrationSQL);
      console.log(`✅ Migration ${migrationFile} completed successfully!`);
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
