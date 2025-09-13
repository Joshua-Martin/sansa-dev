#!/usr/bin/env node

/**
 * Simple migration runner script
 * This script runs database migrations in sequence
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  // Database configuration from environment variables
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'db',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USERNAME || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'A79Vm5D4p2VQHOp2gd5',
    database: process.env.POSTGRES_DATABASE || 'sansa-dev',
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
