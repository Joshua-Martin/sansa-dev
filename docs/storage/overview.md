# Storage Implementation Overview - MVP

## Overview

The storage system provides a unified, secure, and type-safe interface for managing files within the AI Landing Page Studio. Built around project-based isolation, the system supports both development (MinIO) and production (Cloudflare R2) environments while maintaining consistent APIs across different storage backends.

## Core Principles

### Project-Based Storage Architecture

All stored files are associated with specific projects and users, ensuring complete data isolation:

- **User Isolation**: Files are scoped to individual users with proper access controls
- **Project Association**: Every file belongs to a project, enabling organized storage hierarchies
- **Secure Access**: Authentication required for all storage operations

### Environment-Aware Configuration

The system automatically adapts to different environments:

- **Development**: MinIO for local development and testing
- **Production**: Cloudflare R2 for scalable, distributed storage
- **Configuration-Driven**: Runtime switching without code changes

### Type-Safe Operations

Leveraging TypeScript and the existing `BaseFile` interface:

- **Consistent Types**: All storage entities extend `BaseFile` for type safety
- **Domain Extensions**: Specialized interfaces for brand assets and images
- **Validation**: Runtime type checking and validation

## Storage Service Architecture

### Core Service Layer

Located in `packages/nest/src/shared/storage/`, the storage services provide a unified interface for file operations. The services are exported from the `SharedModule` following the established pattern in the codebase.

#### Storage Module Integration

```typescript
// packages/nest/src/shared/storage/storage.module.ts
@Module({
  imports: [ConfigModule],
  providers: [StorageService, MinioStorageProvider, R2StorageProvider],
  exports: [StorageService],
})
export class StorageModule {}

// packages/nest/src/shared/shared.module.ts
@Global()
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UnifiedLLMModule,
    QueueModule,
    StorageModule, // Add storage module
  ],
  providers: [
    RedisService,
    GlobalBlockListService,
    RateLimitGuard,
    DevelopmentCleanupService,
  ],
  exports: [
    RedisService,
    GlobalBlockListService,
    DatabaseModule,
    RateLimitGuard,
    UnifiedLLMModule,
    QueueModule,
    StorageModule, // Export storage module
  ],
})
export class SharedModule {}
```

#### StorageService (Main Service)

The primary service that orchestrates all storage operations, following NestJS patterns:

```typescript
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private provider: StorageProvider;

  constructor(private configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.provider = this.configureProvider();
  }

  // Configuration and setup
  private configureProvider(): StorageProvider;

  // Core CRUD operations
  async uploadFile(request: BaseFileUploadRequest): Promise<BaseFile>;
  async downloadFile(storageKey: string): Promise<Buffer>;
  async deleteFile(storageKey: string): Promise<void>;
  async getFileUrl(storageKey: string, expiresIn?: number): Promise<string>;

  // Bulk operations
  async deleteFiles(storageKeys: string[]): Promise<void>;

  // Utility operations
  async fileExists(storageKey: string): Promise<boolean>;
  async getFileMetadata(storageKey: string): Promise<FileMetadata>;
}
```

#### StorageProvider Interface

Abstract interface for different storage backends:

```typescript
export interface StorageProvider {
  // Core operations
  upload(
    file: Buffer,
    key: string,
    metadata?: FileMetadata
  ): Promise<StorageResult>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;

  // Utility methods
  getUrl(key: string, expiresIn?: number): Promise<string>;
  getMetadata(key: string): Promise<FileMetadata>;

  // Batch operations
  deleteMultiple(keys: string[]): Promise<void>;
}
```

### Environment-Specific Providers

#### MinIO Provider (Development)

```typescript
@Injectable()
export class MinioStorageProvider implements StorageProvider {
  private readonly logger = new Logger(MinioStorageProvider.name);
  private client: Client;
  private bucket: string;

  constructor(private config: MinioConfig) {
    this.client = new Client(config);
    this.bucket = config.bucket;
  }

  async upload(
    file: Buffer,
    key: string,
    metadata?: FileMetadata
  ): Promise<StorageResult> {
    // Implementation
  }

  async download(key: string): Promise<Buffer> {
    // Implementation
  }

  // ... other methods
}
```

#### Cloudflare R2 Provider (Production)

```typescript
@Injectable()
export class R2StorageProvider implements StorageProvider {
  private readonly logger = new Logger(R2StorageProvider.name);
  private client: S3Client;
  private bucket: string;

  constructor(private config: R2Config) {
    this.client = new S3Client({
      region: config.region,
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.bucket = config.bucket;
  }

  async upload(
    file: Buffer,
    key: string,
    metadata?: FileMetadata
  ): Promise<StorageResult> {
    // Implementation
  }

  async download(key: string): Promise<Buffer> {
    // Implementation
  }

  // ... other methods
}
```

## File Organization and Naming

### Storage Key Structure

Files are organized using a hierarchical key structure:

```
/{userId}/{workspaceId}/{fileType}/{filename}-{timestamp}-{uuid}.{extension}
```

**Example keys:**

- `/user-123/project-456/brand-assets/logo-main-20231201-abc123.png`
- `/user-123/project-456/brand-board/inspiration-1-20231201-def456.jpg`
- `/user-123/project-456/code-snapshots/snapshot-20231201-ghi789.zip`

### File Categories

#### Brand Assets (`brand-assets/`)

- **Purpose**: Store logos, wordmarks, and brand files
- **Supported Types**: PNG, JPG, SVG, PDF
- **Size Limits**: 10MB per file
- **Retention**: Indefinite (tied to project lifecycle)

#### Brand Board Images (`brand-board/`)

- **Purpose**: Store visual inspiration and mood board images
- **Supported Types**: PNG, JPG, WebP
- **Size Limits**: 20MB per file
- **Retention**: Indefinite (tied to project lifecycle)

#### Code Snapshots (`code-snapshots/`)

- **Purpose**: Store compressed snapshots of user codebases
- **Supported Types**: ZIP, TAR.GZ
- **Size Limits**: 50MB per file
- **Retention**: Configurable (default 30 days)

## Security and Access Control

### Authentication Requirements

All storage operations require:

- **Valid JWT Token**: User must be authenticated
- **Project Ownership**: User must own the target project
- **File Ownership**: For file-specific operations

### Access Patterns

#### Public Access

- **Brand Assets**: Can be made publicly accessible via signed URLs
- **Brand Board**: Private by default, temporary URLs for previews
- **Code Snapshots**: Always private

#### Signed URL Generation

```typescript
export interface SignedUrlOptions {
  expiresIn: number; // seconds
  contentType?: string;
  contentDisposition?: 'inline' | 'attachment';
}

// Usage
const publicUrl = await storageService.getFileUrl(storageKey, {
  expiresIn: 3600, // 1 hour
  contentDisposition: 'inline',
});
```

### Input Validation and Sanitization

#### File Type Validation

```typescript
export interface FileValidationRules {
  allowedMimeTypes: string[];
  maxSizeBytes: number;
  allowedExtensions: string[];
  scanForMalware: boolean;
}

const brandAssetRules: FileValidationRules = {
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedExtensions: ['.png', '.jpg', '.jpeg', '.svg'],
  scanForMalware: true,
};
```

#### Content Security

- **File Type Verification**: MIME type validation against file content
- **Malware Scanning**: Integration with virus scanning services
- **Content Analysis**: Basic image validation and corruption detection

## Configuration Management

### Environment Variables

Following the existing codebase pattern, storage configuration uses NestJS's `ConfigService` for dependency injection and environment variable access.

#### Development (MinIO)

```bash
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=sansa-dev-files
MINIO_REGION=us-east-1
MINIO_USE_SSL=false
```

#### Production (Cloudflare R2)

```bash
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY=your-access-key
R2_SECRET_KEY=your-secret-key
R2_BUCKET=x21-prod-files
R2_PUBLIC_URL=https://files.x21.app
R2_REGION=auto
```

### Configuration Service Integration

The storage services follow the established pattern of injecting `ConfigService`:

```typescript
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider: StorageProvider;

  constructor(private configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.provider = this.configureProvider();
  }

  private configureProvider(): StorageProvider {
    const provider = this.configService.get('STORAGE_PROVIDER', 'minio');

    switch (provider) {
      case 'minio':
        return new MinioStorageProvider({
          endpoint: this.configService.get(
            'MINIO_ENDPOINT',
            'http://localhost:9000'
          ),
          accessKey: this.configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
          secretKey: this.configService.get(
            'MINIO_SECRET_KEY',
            'minioadmin123'
          ),
          bucket: this.configService.get('MINIO_BUCKET', 'sansa-dev-files'),
          region: this.configService.get('MINIO_REGION', 'us-east-1'),
          useSSL: this.configService.get('MINIO_USE_SSL', 'false') === 'true',
        });

      case 'r2':
        return new R2StorageProvider({
          accountId: this.configService.get('R2_ACCOUNT_ID'),
          accessKeyId: this.configService.get('R2_ACCESS_KEY'),
          secretAccessKey: this.configService.get('R2_SECRET_KEY'),
          bucket: this.configService.get('R2_BUCKET'),
          region: this.configService.get('R2_REGION', 'auto'),
          publicUrl: this.configService.get('R2_PUBLIC_URL'),
        });

      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
  }
}
```

### Runtime Configuration Types

```typescript
export interface StorageConfig {
  provider: 'minio' | 'r2';
  bucket: string;
  region?: string;
  publicUrl?: string;
  signedUrlExpiry: number;
  maxFileSize: number;
  allowedMimeTypes: string[];
}

export interface MinioConfig {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
  useSSL: boolean;
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
  publicUrl?: string;
}
```

## Error Handling and Resilience

### Error Types

```typescript
export class StorageError extends Error {
  constructor(
    public code: StorageErrorCode,
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

export enum StorageErrorCode {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}
```

### Retry and Recovery

- **Automatic Retries**: Failed operations retry with exponential backoff
- **Circuit Breaker**: Prevents cascading failures during storage outages
- **Graceful Degradation**: Fallback to alternative storage or cached responses

## Integration with Context System

The storage services integrate seamlessly with the existing context system, following the established service patterns and using proper dependency injection.

### Brand Assets Storage

```typescript
// Integration with BrandAsset entity
@Injectable()
export class BrandAssetsService {
  private readonly logger = new Logger(BrandAssetsService.name);

  constructor(
    private storageService: StorageService,
    private brandAssetRepository: Repository<BrandAsset>,
    private configService: ConfigService
  ) {}

  async uploadAsset(
    request: UploadBrandAssetRequest,
    userId: string
  ): Promise<BrandAsset> {
    // 1. Validate project ownership
    await this.validateProjectAccess(request.workspaceId, userId);

    // 2. Upload file to storage
    const file = await this.storageService.uploadFile({
      file: request.file,
      workspaceId: request.workspaceId,
      userId,
      assetType: request.assetType,
    });

    // 3. Create database record
    const asset = await this.brandAssetRepository.create({
      ...file,
      workspaceId: request.workspaceId,
      assetType: request.assetType,
    });

    return asset;
  }

  private async validateProjectAccess(
    workspaceId: string,
    userId: string
  ): Promise<void> {
    // Implementation follows existing patterns
  }
}
```

### Brand Board Storage

```typescript
// Integration with BrandImage entity
@Injectable()
export class BrandBoardService {
  private readonly logger = new Logger(BrandBoardService.name);

  constructor(
    private storageService: StorageService,
    private brandImageRepository: Repository<BrandImage>,
    private configService: ConfigService
  ) {}

  async uploadImage(
    request: UploadBrandImageRequest,
    userId: string
  ): Promise<BrandImage> {
    // 1. Validate project ownership
    await this.validateProjectAccess(request.workspaceId, userId);

    // 2. Upload file to storage
    const file = await this.storageService.uploadFile({
      file: request.file,
      workspaceId: request.workspaceId,
      userId,
    });

    // 3. Create database record
    const image = await this.brandImageRepository.create({
      ...file,
      workspaceId: request.workspaceId,
    });

    return image;
  }

  private async validateProjectAccess(
    workspaceId: string,
    userId: string
  ): Promise<void> {
    // Implementation follows existing patterns
  }
}
```

## Performance Optimizations

### Caching Strategy

- **Metadata Caching**: Redis caching for frequently accessed file metadata
- **URL Caching**: Short-lived caching of signed URLs
- **Content Caching**: CDN integration for public assets

### Upload Optimizations

- **Multipart Uploads**: Support for large file uploads
- **Progress Tracking**: Real-time upload progress for user feedback
- **Concurrent Uploads**: Parallel uploads for bulk operations

### Download Optimizations

- **Range Requests**: Support for partial content downloads
- **Compression**: Automatic gzip compression for text-based files
- **CDN Integration**: Global distribution for improved access speeds

## Monitoring and Observability

### Metrics Collection

- **Upload/Download Rates**: Track storage operation performance
- **Storage Usage**: Monitor per-user and per-project usage
- **Error Rates**: Track storage operation failures
- **Latency Metrics**: Monitor operation response times

### Logging Strategy

- **Structured Logging**: Consistent log format across all operations
- **Audit Trails**: Complete audit logs for all file operations
- **Error Tracking**: Detailed error logging with context

## Future Extensions

### Advanced Features (Post-MVP)

- **Versioning**: File versioning for code snapshots
- **Backup**: Automated backup and disaster recovery
- **Analytics**: Storage usage analytics and insights
- **Integration**: Third-party storage provider support

### Scalability Considerations

- **Multi-Region**: Cross-region replication for high availability
- **Auto-Scaling**: Dynamic storage capacity based on usage
- **Cost Optimization**: Intelligent storage tier management

This storage implementation provides a solid foundation for the MVP while maintaining the flexibility to scale and evolve with future requirements.
