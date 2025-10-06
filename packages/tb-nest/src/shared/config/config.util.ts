import { Logger } from '@nestjs/common';

/**
 * Configuration utility for managing environment variables
 *
 * Provides type-safe access to environment variables with validation
 * and error handling for required configuration values.
 */
export class ConfigUtil {
  private static readonly logger = new Logger('ConfigUtil');

  /**
   * Get a required environment variable or throw an error
   * @param key - Environment variable key
   * @param description - Optional description for better error messages
   * @returns Environment variable value
   * @throws Error if the environment variable is not set
   */
  static getRequiredEnv(key: string, description?: string): string {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      const errorMessage = `Required environment variable ${key} is not set${
        description ? ` (${description})` : ''
      }`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    return value.trim();
  }

  /**
   * Get an optional environment variable with a default value
   * @param key - Environment variable key
   * @param defaultValue - Default value if not set
   * @param description - Optional description for logging
   * @returns Environment variable value or default
   */
  static getOptionalEnv(
    key: string,
    defaultValue: string,
    description?: string,
  ): string {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      if (description) {
        this.logger.log(
          `Using default value for ${key} (${description}): ${defaultValue}`,
        );
      }
      return defaultValue;
    }
    return value.trim();
  }

  /**
   * Get a required numeric environment variable
   * @param key - Environment variable key
   * @param description - Optional description for better error messages
   * @returns Parsed number value
   * @throws Error if the environment variable is not set or not a valid number
   */
  static getRequiredNumericEnv(key: string, description?: string): number {
    const value = this.getRequiredEnv(key, description);
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      const errorMessage = `Environment variable ${key} must be a valid number, got: ${value}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    return numValue;
  }

  /**
   * Get an optional numeric environment variable with a default value
   * @param key - Environment variable key
   * @param defaultValue - Default numeric value
   * @param description - Optional description for logging
   * @returns Parsed number value or default
   */
  static getOptionalNumericEnv(
    key: string,
    defaultValue: number,
    description?: string,
  ): number {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      if (description) {
        this.logger.log(
          `Using default value for ${key} (${description}): ${defaultValue}`,
        );
      }
      return defaultValue;
    }
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      this.logger.warn(
        `Invalid numeric value for ${key}: ${value}, using default: ${defaultValue}`,
      );
      return defaultValue;
    }
    return numValue;
  }

  /**
   * Get a boolean environment variable
   * @param key - Environment variable key
   * @param defaultValue - Default boolean value
   * @param description - Optional description for logging
   * @returns Boolean value
   */
  static getBooleanEnv(
    key: string,
    defaultValue: boolean,
    description?: string,
  ): boolean {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      if (description) {
        this.logger.log(
          `Using default value for ${key} (${description}): ${defaultValue}`,
        );
      }
      return defaultValue;
    }
    const lowerValue = value.toLowerCase().trim();
    return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
  }

  /**
   * Validate all required configuration at startup
   * @throws Error if any required configuration is missing
   */
  static validateRequiredConfig(): void {
    this.logger.log('Validating required configuration...');

    try {
      // Database Configuration
      this.getRequiredEnv('TB_POSTGRES_HOST', 'PostgreSQL host address');
      this.getRequiredNumericEnv('TB_POSTGRES_PORT', 'PostgreSQL port number');
      this.getRequiredEnv('TB_POSTGRES_USERNAME', 'PostgreSQL username');
      this.getRequiredEnv('TB_POSTGRES_PASSWORD', 'PostgreSQL password');
      this.getRequiredEnv('TB_POSTGRES_DATABASE', 'PostgreSQL database name');

      // JWT Configuration
      this.getRequiredEnv('JWT_SECRET', 'JWT signing secret');

      // Redis Configuration
      this.getRequiredEnv('REDIS_HOST', 'Redis host address');
      this.getRequiredNumericEnv('REDIS_PORT', 'Redis port number');

      this.logger.log('✅ All required configuration validated successfully');
    } catch (error) {
      this.logger.error('❌ Configuration validation failed');
      throw error;
    }
  }

  /**
   * Get database configuration object
   * @returns Database configuration
   */
  static getDatabaseConfig() {
    return {
      host: this.getRequiredEnv('TB_POSTGRES_HOST'),
      port: this.getRequiredNumericEnv('TB_POSTGRES_PORT'),
      username: this.getRequiredEnv('TB_POSTGRES_USERNAME'),
      password: this.getRequiredEnv('TB_POSTGRES_PASSWORD'),
      database: this.getRequiredEnv('TB_POSTGRES_DATABASE'),
      ssl: this.getBooleanEnv(
        'TB_POSTGRES_SSL',
        false,
        'PostgreSQL SSL connection',
      ),
    };
  }

  /**
   * Get JWT configuration object
   * @returns JWT configuration
   */
  static getJwtConfig() {
    return {
      secret: this.getRequiredEnv('JWT_SECRET'),
      accessTokenExpiresIn: this.getOptionalEnv(
        'JWT_ACCESS_EXPIRES_IN',
        '15m',
        'Access token expiration',
      ),
      refreshTokenExpiresIn: this.getOptionalEnv(
        'JWT_REFRESH_EXPIRES_IN',
        '7d',
        'Refresh token expiration',
      ),
    };
  }

  /**
   * Get Redis configuration object
   * @returns Redis configuration
   */
  static getRedisConfig() {
    return {
      host: this.getRequiredEnv('REDIS_HOST'),
      port: this.getRequiredNumericEnv('REDIS_PORT'),
      password: this.getOptionalEnv('REDIS_PASSWORD', '', 'Redis password'),
      tls: this.getBooleanEnv('REDIS_TLS', false, 'Redis TLS connection'),
    };
  }
}
