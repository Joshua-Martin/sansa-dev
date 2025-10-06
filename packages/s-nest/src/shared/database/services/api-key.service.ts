import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ApiKey } from '../entities/api-key.entity';
import { User } from '../entities/user.entity';

/**
 * Parameters for creating an API key
 */
export interface CreateApiKeyParams {
  userId: string;
  name: string;
  expiresAt?: Date;
}

/**
 * API key response data
 */
export interface ApiKeyResponse {
  id: string;
  name: string;
  key: string; // Only shown on creation
  isActive: boolean;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  lastUsedIp: string | null;
  requestCount: number;
  createdAt: Date;
}

/**
 * Service for managing API keys
 *
 * Handles creation, validation, and management of API keys
 * used by Sansa-X clients for data ingestion.
 */
@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Create a new API key for a user
   *
   * @param params - API key creation parameters
   * @returns The created API key with the secret key
   * @throws NotFoundException if user not found
   * @throws ConflictException if API key name already exists for user
   */
  async createApiKey(params: CreateApiKeyParams): Promise<ApiKeyResponse> {
    const { userId, name, expiresAt } = params;

    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if API key name already exists for this user
    const existingKey = await this.apiKeyRepository.findOne({
      where: { user: { id: userId }, name },
    });

    if (existingKey) {
      throw new ConflictException('API key with this name already exists');
    }

    // Generate a secure API key
    const key = this.generateApiKey();

    // Create API key entity
    const apiKey = this.apiKeyRepository.create({
      key,
      name,
      user,
      userId,
      expiresAt,
    });

    const savedApiKey = await this.apiKeyRepository.save(apiKey);

    return {
      id: savedApiKey.id,
      name: savedApiKey.name,
      key: savedApiKey.key, // Only shown on creation
      isActive: savedApiKey.isActive,
      expiresAt: savedApiKey.expiresAt,
      lastUsedAt: savedApiKey.lastUsedAt,
      lastUsedIp: savedApiKey.lastUsedIp,
      requestCount: savedApiKey.requestCount,
      createdAt: savedApiKey.createdAt,
    };
  }

  /**
   * Validate an API key and return associated user info
   *
   * @param key - The API key to validate
   * @param ipAddress - Optional IP address for usage tracking
   * @returns User information if key is valid
   * @throws BadRequestException if key is invalid or expired
   */
  async validateApiKey(
    key: string,
    ipAddress?: string,
  ): Promise<{ user: User; apiKey: ApiKey }> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { key },
      relations: ['user'],
    });

    if (!apiKey) {
      throw new BadRequestException('Invalid API key');
    }

    if (!apiKey.isValid()) {
      if (!apiKey.isActive) {
        throw new BadRequestException('API key is deactivated');
      }
      if (apiKey.isExpired()) {
        throw new BadRequestException('API key has expired');
      }
    }

    // Update usage statistics
    apiKey.updateUsage(ipAddress);
    await this.apiKeyRepository.save(apiKey);

    return { user: apiKey.user, apiKey };
  }

  /**
   * Get all API keys for a user
   *
   * @param userId - User ID
   * @returns Array of API keys (without the secret key)
   */
  async getUserApiKeys(userId: string): Promise<Omit<ApiKeyResponse, 'key'>[]> {
    const apiKeys = await this.apiKeyRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    return apiKeys.map((apiKey) => ({
      id: apiKey.id,
      name: apiKey.name,
      isActive: apiKey.isActive,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      lastUsedIp: apiKey.lastUsedIp,
      requestCount: apiKey.requestCount,
      createdAt: apiKey.createdAt,
    }));
  }

  /**
   * Deactivate an API key
   *
   * @param userId - User ID (for authorization)
   * @param apiKeyId - API key ID to deactivate
   * @throws NotFoundException if API key not found
   * @throws BadRequestException if API key doesn't belong to user
   */
  async deactivateApiKey(userId: string, apiKeyId: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: apiKeyId },
      relations: ['user'],
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.user.id !== userId) {
      throw new BadRequestException('API key does not belong to user');
    }

    apiKey.isActive = false;
    await this.apiKeyRepository.save(apiKey);
  }

  /**
   * Delete an API key
   *
   * @param userId - User ID (for authorization)
   * @param apiKeyId - API key ID to delete
   * @throws NotFoundException if API key not found
   * @throws BadRequestException if API key doesn't belong to user
   */
  async deleteApiKey(userId: string, apiKeyId: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: apiKeyId },
      relations: ['user'],
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.user.id !== userId) {
      throw new BadRequestException('API key does not belong to user');
    }

    await this.apiKeyRepository.remove(apiKey);
  }

  /**
   * Generate a secure API key
   *
   * @returns A cryptographically secure API key
   */
  private generateApiKey(): string {
    // Generate a 32-byte random key and encode as base64
    return crypto.randomBytes(32).toString('base64');
  }
}
