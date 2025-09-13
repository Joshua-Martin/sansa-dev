import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LlmTotalUse } from '../entities/llm-total-use.entity';
import { User } from '../entities/user.entity';

/**
 * Interface for updating LLM total usage
 */
export interface UpdateLlmTotalUseParams {
  userId?: string; // null for global stats
  date: Date;
  requestsIncrement: number;
  inputTokensIncrement: number;
  outputTokensIncrement: number;
  costUsdIncrement: number;
  modelName: string;
}

/**
 * Interface for daily usage limits
 */
export interface DailyUsageLimits {
  maxRequests?: number;
  maxTokens?: number;
  maxCostUsd?: number;
}

/**
 * Service for managing aggregate LLM usage statistics
 *
 * Handles daily usage totals per user and globally for analytics,
 * billing, and usage limit enforcement.
 */
@Injectable()
export class LlmTotalUseService {
  constructor(
    @InjectRepository(LlmTotalUse)
    private llmTotalUseRepository: Repository<LlmTotalUse>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Update daily usage totals for a user
   *
   * @param params - Usage update parameters
   * @returns Updated or created total use record
   */
  async updateDailyUsage(
    params: UpdateLlmTotalUseParams,
  ): Promise<LlmTotalUse> {
    const dateString = params.date.toISOString().split('T')[0];
    const user = params.userId
      ? await this.userRepository.findOne({
          where: { id: params.userId },
        })
      : null;

    // Find existing record or create new one
    let totalUse = await this.llmTotalUseRepository.findOne({
      where: {
        date: new Date(dateString),
        user: user ? { id: params.userId } : null,
      },
      relations: ['user'],
    });

    if (!totalUse) {
      totalUse = this.llmTotalUseRepository.create({
        date: new Date(dateString),
        user,
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCostUsd: 0,
        modelBreakdown: {},
      });
    }

    // Update totals
    totalUse.totalRequests += params.requestsIncrement;
    totalUse.totalInputTokens += params.inputTokensIncrement;
    totalUse.totalOutputTokens += params.outputTokensIncrement;
    totalUse.totalCostUsd =
      Number(totalUse.totalCostUsd) + params.costUsdIncrement;

    // Update model breakdown
    const breakdown = totalUse.modelBreakdown || {};
    if (!breakdown[params.modelName]) {
      breakdown[params.modelName] = {
        requests: 0,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
      };
    }

    breakdown[params.modelName].requests += params.requestsIncrement;
    breakdown[params.modelName].inputTokens += params.inputTokensIncrement;
    breakdown[params.modelName].outputTokens += params.outputTokensIncrement;
    breakdown[params.modelName].costUsd += params.costUsdIncrement;

    totalUse.modelBreakdown = breakdown;

    return this.llmTotalUseRepository.save(totalUse);
  }

  /**
   * Get daily usage for a specific user
   *
   * @param userId - User ID
   * @param date - Date to get usage for
   * @returns Daily usage record or null if not found
   */
  async getUserDailyUsage(
    userId: string,
    date: Date,
  ): Promise<LlmTotalUse | null> {
    const dateString = date.toISOString().split('T')[0];
    return this.llmTotalUseRepository.findOne({
      where: {
        date: new Date(dateString),
        user: { id: userId },
      },
      relations: ['user'],
    });
  }

  /**
   * Get global daily usage (all users combined)
   *
   * @param date - Date to get usage for
   * @returns Global daily usage record or null if not found
   */
  async getGlobalDailyUsage(date: Date): Promise<LlmTotalUse | null> {
    const dateString = date.toISOString().split('T')[0];
    return this.llmTotalUseRepository.findOne({
      where: {
        date: new Date(dateString),
        user: null,
      },
    });
  }

  /**
   * Check if user has exceeded daily limits
   *
   * @param userId - User ID
   * @param date - Date to check
   * @param limits - Usage limits to check against
   * @returns True if limits are exceeded
   */
  async hasUserExceededLimits(
    userId: string,
    date: Date,
    limits: DailyUsageLimits,
  ): Promise<boolean> {
    const usage = await this.getUserDailyUsage(userId, date);
    if (!usage) {
      return false;
    }

    return usage.hasExceededDailyLimits(limits);
  }

  /**
   * Get usage history for a user over a date range
   *
   * @param userId - User ID
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Array of daily usage records
   */
  async getUserUsageHistory(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<LlmTotalUse[]> {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    return this.llmTotalUseRepository.find({
      where: {
        user: { id: userId },
        date: Between(new Date(start), new Date(end)),
      },
      relations: ['user'],
      order: { date: 'DESC' },
    });
  }

  /**
   * Get global usage history over a date range
   *
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Array of global daily usage records
   */
  async getGlobalUsageHistory(
    startDate: Date,
    endDate: Date,
  ): Promise<LlmTotalUse[]> {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    return this.llmTotalUseRepository.find({
      where: {
        user: null,
        date: Between(new Date(start), new Date(end)),
      },
      order: { date: 'DESC' },
    });
  }

  /**
   * Get top users by usage for a specific date
   *
   * @param date - Date to analyze
   * @param limit - Number of top users to return
   * @param sortBy - Sort criteria ('requests', 'tokens', or 'cost')
   * @returns Top users with their usage
   */
  async getTopUsersByUsage(
    date: Date,
    limit: number = 10,
    sortBy: 'requests' | 'tokens' | 'cost' = 'requests',
  ): Promise<LlmTotalUse[]> {
    const dateString = date.toISOString().split('T')[0];

    let orderBy: string;
    switch (sortBy) {
      case 'tokens':
        orderBy = '(totalInputTokens + totalOutputTokens)';
        break;
      case 'cost':
        orderBy = 'totalCostUsd';
        break;
      default:
        orderBy = 'totalRequests';
    }

    return this.llmTotalUseRepository
      .createQueryBuilder('totalUse')
      .leftJoinAndSelect('totalUse.user', 'user')
      .where('totalUse.date = :date', { date: new Date(dateString) })
      .andWhere('totalUse.user IS NOT NULL')
      .orderBy(orderBy, 'DESC')
      .limit(limit)
      .getMany();
  }
}
