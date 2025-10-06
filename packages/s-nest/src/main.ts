// Import TypeORM patch first to ensure crypto is globally available
import './shared/database/typeorm-patch';

// Load environment variables before anything else
import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';

// Load environment variables from .env files
dotenvConfig({ path: path.resolve(process.cwd(), '.env.local') });
dotenvConfig({ path: path.resolve(process.cwd(), '.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigUtil } from './shared/config/config.util';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as fs from 'fs';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';

/**
 * Types of messages that can be logged
 */
type LogMessage = string | number | boolean | object | Error | null | undefined;

/**
 * Custom logger class that provides different logging profiles for
 * production and development environments with improved type safety
 */
class AppLogger extends Logger {
  private readonly isProduction: boolean;

  constructor(context?: string) {
    super(context);
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Log a message with appropriate formatting based on environment
   * @param message - The message to log
   * @param context - Optional context override
   */
  log(message: LogMessage, context?: string): void {
    if (this.isProduction) {
      // Production: structured, minimal logs
      super.log(this.formatForProduction('INFO', message), context);
    } else {
      // Development: verbose, developer-friendly logs
      super.log(message, context);
    }
  }

  /**
   * Log an error with appropriate formatting based on environment
   * @param message - The error message
   * @param trace - Optional stack trace
   * @param context - Optional context override
   */
  error(message: LogMessage, trace?: string, context?: string): void {
    if (this.isProduction) {
      // Production: structured error format with essential info
      super.error(this.formatForProduction('ERROR', message), trace, context);
    } else {
      // Development: detailed error information with full stack trace
      super.error(message, trace, context);
    }
  }

  /**
   * Log a warning with appropriate formatting based on environment
   * @param message - The warning message
   * @param context - Optional context override
   */
  warn(message: LogMessage, context?: string): void {
    if (this.isProduction) {
      super.warn(this.formatForProduction('WARN', message), context);
    } else {
      super.warn(message, context);
    }
  }

  /**
   * Log debug information (only in development)
   * @param message - The debug message
   * @param context - Optional context override
   */
  debug(message: LogMessage, context?: string): void {
    if (!this.isProduction) {
      // Only show debug logs in development
      super.debug(message, context);
    }
  }

  /**
   * Format log messages for production environment
   * @param level - Log level
   * @param message - Log message
   * @returns Formatted log string
   */
  private formatForProduction(
    level: 'INFO' | 'ERROR' | 'WARN',
    message: LogMessage,
  ): string {
    const timestamp = new Date().toISOString();

    if (message === null || message === undefined) {
      return `[${timestamp}] [${level}] ${String(message)}`;
    }

    // For objects or errors, stringify with some formatting
    if (typeof message === 'object') {
      if (message instanceof Error) {
        return `[${timestamp}] [${level}] ${message.message}`;
      }
      return `[${timestamp}] [${level}] ${JSON.stringify(message)}`;
    }

    return `[${timestamp}] [${level}] ${message}`;
  }
}

// Replace the global logger with our custom logger
const logger = new AppLogger('Application');

/**
 * Configure process-wide error handlers
 */
function setupProcessErrorHandlers(): void {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}`);
    logger.error(`Reason: ${reason}`);
    if (reason instanceof Error) {
      logger.error(`Stack: ${reason.stack}`);
    }
    // Gracefully shutdown on unhandled rejections in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    logger.error(`Stack: ${error.stack}`);
    // Always exit on uncaught exceptions
    process.exit(1);
  });
}

/**
 * Configure Swagger documentation
 * @param app - NestJS application instance
 */
function setupSwagger(app: INestApplication): void {
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Chat Agent API')
      .setDescription('API for Chat Agent system with WebSocket support')
      .setVersion('1.0')
      .addServer('/api/v1')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }
}

/**
 * Custom Socket.IO Adapter for NestJS WebSocket Integration
 *
 * Purpose: Provides unified WebSocket connection handling by integrating Socket.IO
 * with the main HTTP server, ensuring consistent connection lifecycle management
 * across both HTTP and WebSocket protocols.
 *
 * Function: Extends the base IoAdapter to implement server creation strategy that
 * attaches to the HTTP server after it has started listening, enabling proper
 * WebSocket gateway functionality with room-based broadcasting and session management.
 *
 * Need: Required for real-time features including HMR updates, chat messaging,
 * and workspace session coordination that depend on reliable WebSocket connections
 * sharing the same port and connection context as the main HTTP server.
 */
class CustomSocketIoAdapter extends IoAdapter {}

/**
 * Configure centralized API versioning and global REST prefix
 *
 * - Uses URI-based versioning so routes are exposed under `/v{n}` segments
 * - Sets a global REST prefix of `api` so final routes become `/api/v1/...`
 *
 * @param app - NestJS application instance
 */
function setupApiVersioning(app: INestApplication): void {
  logger.log('Configuring API versioning and global prefix...');
  // Global REST prefix: /api
  app.setGlobalPrefix('api');

  // URI-based versioning: /v1, /v2, ...
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  logger.log('API versioning configured: prefix=/api, version=v1');
}

/**
 * Bootstrap function to initialize and configure the NestJS application
 * S Backend - Runs on port 3000 with s-db PostgreSQL database
 */
async function bootstrap(): Promise<void> {
  const appLogger = new AppLogger('S-Backend');
  appLogger.log('Starting S Backend application...');

  // Validate required configuration before creating the NestJS app
  try {
    appLogger.log('Validating S environment configuration...');
    ConfigUtil.validateRequiredConfig();
    appLogger.log('S environment configuration validated successfully');
  } catch (error) {
    appLogger.error(
      'Failed to start S application due to missing configuration:',
      error instanceof Error ? error.stack : undefined,
    );
    process.exit(1);
  }

  // Check if HTTPS is enabled via environment variable
  const useHttps = process.env.USE_HTTPS === 'true';
  // S Backend uses S_PORT (default 3000) or PORT fallback
  const port = parseInt(
    process.env.S_PORT || process.env.PORT || (useHttps ? '3443' : '3000'),
    10,
  );
  const host = process.env.S_HOST || process.env.HOST || '0.0.0.0';
  const isDev = process.env.NODE_ENV !== 'production';

  let app;

  if (useHttps && isDev) {
    // HTTPS setup
    try {
      const keyPath = process.env.SSL_KEY_PATH || '/app/ssl/private-key.pem';
      const certPath = process.env.SSL_CERT_PATH || '/app/ssl/certificate.pem';

      appLogger.log(
        `Loading SSL certificates from: ${keyPath} and ${certPath}`,
      );

      const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };

      const server = express();
      app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
        httpsOptions,
      });
      appLogger.log('S NestJS application created with HTTPS enabled');
    } catch (error) {
      appLogger.error(
        `S Backend failed to load SSL certificates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  } else {
    // Regular HTTP setup
    app = await NestFactory.create(AppModule);
    appLogger.log('S NestJS application created with HTTP');
  }

  // Setup WebSocket adapter BEFORE any other configuration
  // This ensures the adapter is available when gateways are instantiated
  appLogger.log('Configuring WebSocket adapter (pre-startup)...');
  app.useWebSocketAdapter(new CustomSocketIoAdapter(app));
  appLogger.log('WebSocket adapter configured');

  // Setup process error handlers first
  appLogger.log('Setting up process error handlers...'); // Debug log
  setupProcessErrorHandlers();
  appLogger.log('Process error handlers configured'); // Debug log

  // Setup API versioning and global prefix for REST
  appLogger.log('Enabling API versioning...'); // Debug log
  setupApiVersioning(app);
  appLogger.log('API versioning enabled'); // Debug log

  // Setup Swagger
  appLogger.log('Configuring Swagger...'); // Debug log
  setupSwagger(app);
  appLogger.log('Swagger configuration complete'); // Debug log

  // Set global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Set global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  // Enable CORS with strict configuration
  if (isDev) {
    app.enableCors({
      origin: (origin, callback) => {
        // Development origins
        const devOrigins = [
          'http://localhost:4200',
          'http://127.0.0.1:4200',
          /^http:\/\/192\.168\.1\.(1[0-9]|[1-9]):\d+$/, // Local network IPs
        ];

        // In development, allow dev origins
        if (
          !origin ||
          devOrigins.some((dev) =>
            dev instanceof RegExp ? dev.test(origin) : dev === origin,
          )
        ) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
      maxAge: 3600, // Cache preflight requests for 1 hour
    });
  }

  // Graceful shutdown
  const signals = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, async () => {
      appLogger.log(`Received ${signal}, starting graceful shutdown...`);
      await app.close();
      process.exit(0);
    });
  }

  // Start the server
  await app.listen(port, host);

  const protocol = useHttps ? 'https' : 'http';
  appLogger.log(
    `🚀 S Backend is running on: ${protocol}://${host}:${port} ${
      isDev ? '(Development)' : '(Production)'
    }`,
  );
  appLogger.log(
    `📚 S API Docs available at: ${protocol}://${host}:${port}/docs`,
  );
  appLogger.log(
    `🗄️  S Database: ${process.env.S_POSTGRES_HOST}:${process.env.S_POSTGRES_PORT}/${process.env.S_POSTGRES_DATABASE}`,
  );
}

bootstrap().catch((err) => {
  console.error('S Backend bootstrap failed:', err);
  process.exit(1);
});

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new AppLogger('S-GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(`Exception occurred: ${exception}`);
    if (exception instanceof Error) {
      this.logger.error(`Stack: ${exception.stack}`);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        exception instanceof Error
          ? exception.message
          : 'Internal server error',
    });
  }
}
