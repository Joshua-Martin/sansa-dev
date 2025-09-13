/**
 * Storage Module
 *
 * Configures and provides all storage-related services and providers.
 * This module encapsulates the entire storage system and can be imported
 * by other modules that need storage functionality.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';

/**
 * Storage module that provides unified file storage functionality
 *
 * This module configures:
 * - StorageService: Main service that creates and manages storage providers internally
 *
 * The StorageService automatically selects and configures the appropriate provider
 * (MinIO for development, R2 for production) based on environment configuration.
 */
@Module({
  imports: [
    // Import ConfigModule to access environment variables
    ConfigModule,
  ],
  providers: [
    // Main storage service - creates and manages providers internally
    StorageService,
  ],
  exports: [
    // Export the main storage service for use by other modules
    StorageService,
  ],
})
export class StorageModule {}
