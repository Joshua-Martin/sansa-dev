import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LlmUse } from '../entities/llm-use.entity';
import { User } from '../entities/user.entity';

/**
 * Interface for creating LLM usage records
 */
export interface CreateLlmUseParams {
  userId: string;
  modelName: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  requestData?: Record<string, string | number | boolean>;
  status?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Interface for LLM usage statistics
 */
export interface LlmUseStats {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  modelBreakdown: Record<
    string,
    {
      requests: number;
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
    }
  >;
}

/**
 * Service for managing LLM usage tracking
 *
 * Handles recording individual LLM requests and calculating usage statistics
 */
@Injectable()
export class LlmUseService {
  constructor(
    @InjectRepository(LlmUse)
    private llmUseRepository: Repository<LlmUse>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Record a new LLM usage event
   *
   * @param params - Usage parameters
   * @returns Created LLM use record
   */
  async recordUsage(params: CreateLlmUseParams): Promise<LlmUse> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: params.userId },
    });

    if (!user) {
      throw new Error(`User with ID ${params.userId} not found`);
    }

    const llmUse = this.llmUseRepository.create({
      user,
      modelName: params.modelName,
      inputTokens: params.inputTokens || 0,
      outputTokens: params.outputTokens || 0,
      costUsd: params.costUsd || 0,
      requestData: params.requestData || {},
      status: params.status || 'completed',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return this.llmUseRepository.save(llmUse);
  }

  /**
   * Get usage statistics for a user within a date range
   *
   * @param userId - User ID
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Usage statistics
   */
  async getUserUsageStats(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<LlmUseStats> {
    const usageRecords = await this.llmUseRepository.find({
      where: {
        user: { id: userId },
        timestamp: Between(startDate, endDate),
      },
    });

    return this.calculateStats(usageRecords);
  }

  /**
   * Get usage statistics for a user for today
   *
   * @param userId - User ID
   * @returns Today's usage statistics
   */
  async getUserDailyUsage(userId: string): Promise<LlmUseStats> {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return this.getUserUsageStats(userId, startOfDay, endOfDay);
  }

  /**
   * Get all usage records for a user with pagination
   *
   * @param userId - User ID
   * @param limit - Number of records to return
   * @param offset - Number of records to skip
   * @returns Usage records
   */
  async getUserUsageHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ records: LlmUse[]; total: number }> {
    const [records, total] = await this.llmUseRepository.findAndCount({
      where: { user: { id: userId } },
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['user'],
    });

    return { records, total };
  }

  /**
   * Get global usage statistics within a date range
   *
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Global usage statistics
   */
  async getGlobalUsageStats(
    startDate: Date,
    endDate: Date,
  ): Promise<LlmUseStats> {
    const usageRecords = await this.llmUseRepository.find({
      where: {
        timestamp: Between(startDate, endDate),
      },
    });

    return this.calculateStats(usageRecords);
  }

  /**
   * Calculate usage statistics from usage records
   *
   * @param records - LLM usage records
   * @returns Calculated statistics
   */
  private calculateStats(records: LlmUse[]): LlmUseStats {
    const stats: LlmUseStats = {
      totalRequests: records.length,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
      modelBreakdown: {},
    };

    for (const record of records) {
      stats.totalInputTokens += record.inputTokens || 0;
      stats.totalOutputTokens += record.outputTokens || 0;
      stats.totalCostUsd += Number(record.costUsd) || 0;

      // Track model breakdown
      if (!stats.modelBreakdown[record.modelName]) {
        stats.modelBreakdown[record.modelName] = {
          requests: 0,
          inputTokens: 0,
          outputTokens: 0,
          costUsd: 0,
        };
      }

      const modelStats = stats.modelBreakdown[record.modelName];
      modelStats.requests += 1;
      modelStats.inputTokens += record.inputTokens || 0;
      modelStats.outputTokens += record.outputTokens || 0;
      modelStats.costUsd += Number(record.costUsd) || 0;
    }

    return stats;
  }
}
