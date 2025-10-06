import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLMApiCallRecord } from '../entities/llm-api-call-record.entity';
import {
  CreateLLMApiCallRecordInput,
  createLLMApiCallRecord,
} from '@sansa-dev/s-shared';

/**
 * Service for managing LLM API call records
 *
 * Handles storage and retrieval of Sansa-X monitoring data
 * with support for analytics and reporting.
 */
@Injectable()
export class LLMApiCallRecordService {
  private readonly logger = new Logger(LLMApiCallRecordService.name);

  constructor(
    @InjectRepository(LLMApiCallRecord)
    private recordRepository: Repository<LLMApiCallRecord>,
  ) {}

  /**
   * Create a new LLM API call record
   *
   * @param input - The input data containing pre-request and post-response payloads
   * @returns The created record
   */
  async createRecord(
    input: CreateLLMApiCallRecordInput,
  ): Promise<LLMApiCallRecord> {
    const { appId, preRequest, postResponse } = input;

    // Create the record using the shared utility function
    const recordData = createLLMApiCallRecord(input);

    // Convert string timestamps to Date objects for database storage
    const record = this.recordRepository.create({
      ...recordData,
      requestTimestamp: new Date(recordData.requestTimestamp),
      responseTimestamp: new Date(recordData.responseTimestamp),
    });

    const savedRecord = await this.recordRepository.save(record);

    this.logger.debug(
      `Created LLM API call record: id=${savedRecord.id}, appId=${appId}, model=${savedRecord.model}`,
    );

    return savedRecord;
  }

  /**
   * Find a record by ID
   *
   * @param id - Record ID
   * @returns The record or null if not found
   */
  async findById(id: string): Promise<LLMApiCallRecord | null> {
    return this.recordRepository.findOne({
      where: { id },
    });
  }

  /**
   * Get all records for a specific app
   *
   * @param appId - Application ID
   * @param options - Query options
   * @returns Array of records
   */
  async getRecordsByAppId(
    appId: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      model?: string;
      provider?: string;
      name?: string;
      promptVersion?: string;
    } = {},
  ): Promise<LLMApiCallRecord[]> {
    const queryBuilder = this.recordRepository
      .createQueryBuilder('record')
      .where('record.appId = :appId', { appId })
      .orderBy('record.requestTimestamp', 'DESC');

    // Apply filters
    if (options.startDate) {
      queryBuilder.andWhere('record.requestTimestamp >= :startDate', {
        startDate: options.startDate,
      });
    }

    if (options.endDate) {
      queryBuilder.andWhere('record.requestTimestamp <= :endDate', {
        endDate: options.endDate,
      });
    }

    if (options.model) {
      queryBuilder.andWhere('record.model = :model', { model: options.model });
    }

    if (options.provider) {
      queryBuilder.andWhere('record.provider = :provider', {
        provider: options.provider,
      });
    }

    if (options.name) {
      queryBuilder.andWhere('record.name = :name', { name: options.name });
    }

    if (options.promptVersion) {
      queryBuilder.andWhere('record.promptVersion = :promptVersion', {
        promptVersion: options.promptVersion,
      });
    }

    // Apply pagination
    if (options.limit) {
      queryBuilder.limit(options.limit);
    }

    if (options.offset) {
      queryBuilder.offset(options.offset);
    }

    return queryBuilder.getMany();
  }

  /**
   * Get analytics for an app
   *
   * @param appId - Application ID
   * @param options - Analytics options
   * @returns Analytics data
   */
  async getAnalytics(
    appId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      groupBy?: 'day' | 'hour' | 'model' | 'provider' | 'name';
    } = {},
  ): Promise<any> {
    const queryBuilder = this.recordRepository
      .createQueryBuilder('record')
      .where('record.appId = :appId', { appId });

    if (options.startDate) {
      queryBuilder.andWhere('record.requestTimestamp >= :startDate', {
        startDate: options.startDate,
      });
    }

    if (options.endDate) {
      queryBuilder.andWhere('record.requestTimestamp <= :endDate', {
        endDate: options.endDate,
      });
    }

    // Basic statistics
    const statsQuery = queryBuilder
      .select([
        'COUNT(*) as totalCalls',
        'SUM(CASE WHEN record.error IS NULL THEN 1 ELSE 0 END) as successfulCalls',
        'SUM(CASE WHEN record.error IS NOT NULL THEN 1 ELSE 0 END) as failedCalls',
        'AVG(record.durationMs) as avgDurationMs',
        'SUM(record.inputTokenCount) as totalInputTokens',
        'SUM(record.outputTokenCount) as totalOutputTokens',
        'SUM(record.inputTokenCount + record.outputTokenCount) as totalTokens',
      ])
      .getRawOne();

    return statsQuery;
  }

  /**
   * Delete records older than a certain date
   *
   * @param appId - Application ID
   * @param beforeDate - Delete records before this date
   * @returns Number of deleted records
   */
  async deleteOldRecords(appId: string, beforeDate: Date): Promise<number> {
    const result = await this.recordRepository
      .createQueryBuilder()
      .delete()
      .where('appId = :appId', { appId })
      .andWhere('requestTimestamp < :beforeDate', { beforeDate })
      .execute();

    this.logger.log(
      `Deleted ${result.affected} old records for appId: ${appId}`,
    );

    return result.affected || 0;
  }
}
