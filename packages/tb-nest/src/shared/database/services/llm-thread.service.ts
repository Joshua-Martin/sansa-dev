import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { LLMThread } from '../entities/llm-thread.entity';
import { LLMMessage } from '../entities/llm-message.entity';
import {
  LLMThreadStatus,
  CreateLLMThreadRequest,
  UpdateLLMThreadRequest,
} from '../../../../../tb-shared/src';

/**
 * Service for managing LLM chat threads
 *
 * Provides CRUD operations and business logic for chat threads.
 * Handles thread creation, updates, retrieval, and deletion.
 */
@Injectable()
export class LLMThreadService {
  constructor(
    @InjectRepository(LLMThread)
    private readonly threadRepository: Repository<LLMThread>,
    @InjectRepository(LLMMessage)
    private readonly messageRepository: Repository<LLMMessage>,
  ) {}

  /**
   * Create a new LLM thread
   *
   * @param {string} userId - ID of the user creating the thread
   * @param {CreateLLMThreadRequest} request - Thread creation request
   * @returns {Promise<LLMThread>} The created thread
   */
  async createThread(
    userId: string,
    request: CreateLLMThreadRequest,
  ): Promise<LLMThread> {
    const thread = this.threadRepository.create({
      userId,
      title: request.title || 'New Chat',
      status: 'active',
      messageCount: 0,
      lastMessageAt: null,
    });

    return this.threadRepository.save(thread);
  }

  /**
   * Find a thread by ID
   *
   * @param {string} threadId - ID of the thread to find
   * @param {string} userId - ID of the user (for authorization)
   * @returns {Promise<LLMThread | null>} The found thread or null
   */
  async findById(threadId: string, userId: string): Promise<LLMThread | null> {
    return this.threadRepository.findOne({
      where: { id: threadId, userId },
    });
  }

  /**
   * Find a thread by ID with messages
   *
   * @param {string} threadId - ID of the thread to find
   * @param {string} userId - ID of the user (for authorization)
   * @param {number} limit - Maximum number of messages to load (default: 50)
   * @returns {Promise<LLMThread | null>} The found thread with messages or null
   */
  async findByIdWithMessages(
    threadId: string,
    userId: string,
    limit: number = 50,
  ): Promise<LLMThread | null> {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId, userId },
    });

    if (!thread) {
      return null;
    }

    // Load messages separately to have better control over ordering and limit
    if (limit) {
      // Get the most recent N messages, then reverse to chronological order
      const messages = await this.messageRepository.find({
        where: { threadId },
        order: { createdAt: 'DESC' },
        take: limit,
      });
      thread.messages = messages.reverse(); // Reverse to get chronological order
    } else {
      // Load all messages in chronological order
      const messages = await this.messageRepository.find({
        where: { threadId },
        order: { createdAt: 'ASC' },
      });
      thread.messages = messages;
    }
    return thread;
  }

  /**
   * Find threads for a user
   *
   * @param {string} userId - ID of the user
   * @param {LLMThreadStatus[]} statuses - Optional array of statuses to filter by
   * @param {number} limit - Maximum number of threads to return (default: 20)
   * @param {number} offset - Number of threads to skip (default: 0)
   * @returns {Promise<LLMThread[]>} Array of threads
   */
  async findByUser(
    userId: string,
    statuses?: LLMThreadStatus[],
    limit: number = 20,
    offset: number = 0,
  ): Promise<LLMThread[]> {
    const where: FindOptionsWhere<LLMThread> = { userId };

    if (statuses && statuses.length > 0) {
      where.status = statuses.length === 1 ? statuses[0] : In(statuses);
    }

    return this.threadRepository.find({
      where,
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Update a thread
   *
   * @param {string} threadId - ID of the thread to update
   * @param {string} userId - ID of the user (for authorization)
   * @param {UpdateLLMThreadRequest} request - Update request
   * @returns {Promise<LLMThread | null>} The updated thread or null if not found
   */
  async updateThread(
    threadId: string,
    userId: string,
    request: UpdateLLMThreadRequest,
  ): Promise<LLMThread | null> {
    const thread = await this.findById(threadId, userId);

    if (!thread || !thread.canModify()) {
      return null;
    }

    if (request.title !== undefined) {
      thread.title = request.title;
    }

    if (request.status !== undefined) {
      thread.status = request.status;
    }

    return this.threadRepository.save(thread);
  }

  /**
   * Delete a thread (soft delete by changing status)
   *
   * @param {string} threadId - ID of the thread to delete
   * @param {string} userId - ID of the user (for authorization)
   * @returns {Promise<boolean>} True if thread was deleted, false otherwise
   */
  async deleteThread(threadId: string, userId: string): Promise<boolean> {
    const result = await this.threadRepository.update(
      { id: threadId, userId },
      { status: 'deleted' },
    );

    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Hard delete a thread and all its messages
   *
   * @param {string} threadId - ID of the thread to delete
   * @param {string} userId - ID of the user (for authorization)
   * @returns {Promise<boolean>} True if thread was deleted, false otherwise
   */
  async hardDeleteThread(threadId: string, userId: string): Promise<boolean> {
    const result = await this.threadRepository.delete({
      id: threadId,
      userId,
    });

    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Update thread's last message timestamp and message count
   *
   * @param {string} threadId - ID of the thread to update
   * @returns {Promise<void>}
   */
  async updateLastMessage(threadId: string): Promise<void> {
    await this.threadRepository.update(
      { id: threadId },
      {
        lastMessageAt: new Date(),
        messageCount: () => 'message_count + 1',
      },
    );
  }

  /**
   * Count threads for a user
   *
   * @param {string} userId - ID of the user
   * @param {LLMThreadStatus[]} statuses - Optional array of statuses to filter by
   * @returns {Promise<number>} Count of threads
   */
  async countByUser(
    userId: string,
    statuses?: LLMThreadStatus[],
  ): Promise<number> {
    const where: FindOptionsWhere<LLMThread> = { userId };

    if (statuses && statuses.length > 0) {
      where.status = statuses.length === 1 ? statuses[0] : In(statuses);
    }

    return this.threadRepository.count({ where });
  }

  /**
   * Project-scoped query methods
   */

  /**
   * Find threads by project
   *
   * @param {string} workspaceId - ID of the project
   * @param {string} userId - ID of the user (for authorization)
   * @param {LLMThreadStatus[]} statuses - Optional array of statuses to filter by
   * @param {number} limit - Maximum number of threads to return (default: 20)
   * @param {number} offset - Number of threads to skip (default: 0)
   * @returns {Promise<LLMThread[]>} Array of threads for the project
   */
  async findByProject(
    workspaceId: string,
    userId: string,
    statuses?: LLMThreadStatus[],
    limit: number = 20,
    offset: number = 0,
  ): Promise<LLMThread[]> {
    const where: FindOptionsWhere<LLMThread> = {
      workspaceId,
      userId,
    };

    if (statuses && statuses.length > 0) {
      where.status = statuses.length === 1 ? statuses[0] : In(statuses);
    }

    return this.threadRepository.find({
      where,
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Create a new thread associated with a project
   *
   * @param {string} userId - ID of the user creating the thread
   * @param {string} workspaceId - ID of the project to associate with
   * @param {CreateLLMThreadRequest} request - Thread creation request
   * @returns {Promise<LLMThread>} The created thread
   */
  async createProjectThread(
    userId: string,
    workspaceId: string,
    request: CreateLLMThreadRequest,
  ): Promise<LLMThread> {
    const thread = this.threadRepository.create({
      userId,
      workspaceId,
      title: request.title || 'New Chat',
      status: 'active',
      messageCount: 0,
      lastMessageAt: null,
    });

    return this.threadRepository.save(thread);
  }

  /**
   * Get project thread summary
   *
   * @param {string} workspaceId - ID of the project
   * @param {string} userId - ID of the user (for authorization)
   * @returns {Promise<{totalThreads: number, activeThreads: number, lastMessageAt?: Date}>}
   */
  async getProjectThreadSummary(
    workspaceId: string,
    userId: string,
  ): Promise<{
    totalThreads: number;
    activeThreads: number;
    archivedThreads: number;
    lastMessageAt?: Date;
  }> {
    const threads = await this.findByProject(workspaceId, userId);

    const activeThreads = threads.filter(
      (thread) => thread.status === 'active',
    ).length;
    const archivedThreads = threads.filter(
      (thread) => thread.status === 'archived',
    ).length;

    const lastMessageAt = threads
      .filter((thread) => thread.lastMessageAt)
      .sort(
        (a, b) =>
          (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0),
      )[0]?.lastMessageAt;

    return {
      totalThreads: threads.length,
      activeThreads,
      archivedThreads,
      lastMessageAt,
    };
  }

  /**
   * Associate an existing thread with a project
   *
   * @param {string} threadId - ID of the thread
   * @param {string} userId - ID of the user (for authorization)
   * @param {string} workspaceId - ID of the project to associate with
   * @returns {Promise<LLMThread | null>} The updated thread or null if not found
   */
  async associateWithProject(
    threadId: string,
    userId: string,
    workspaceId: string,
  ): Promise<LLMThread | null> {
    const thread = await this.findById(threadId, userId);

    if (!thread) {
      return null;
    }

    thread.workspaceId = workspaceId;
    return this.threadRepository.save(thread);
  }

  /**
   * Remove project association from a thread
   *
   * @param {string} threadId - ID of the thread
   * @param {string} userId - ID of the user (for authorization)
   * @returns {Promise<LLMThread | null>} The updated thread or null if not found
   */
  async removeProjectAssociation(
    threadId: string,
    userId: string,
  ): Promise<LLMThread | null> {
    const thread = await this.findById(threadId, userId);

    if (!thread) {
      return null;
    }

    thread.workspaceId = null;
    return this.threadRepository.save(thread);
  }

  /**
   * Count threads for a project
   *
   * @param {string} workspaceId - ID of the project
   * @param {string} userId - ID of the user (for authorization)
   * @param {LLMThreadStatus[]} statuses - Optional array of statuses to filter by
   * @returns {Promise<number>} Count of threads for the project
   */
  async countByProject(
    workspaceId: string,
    userId: string,
    statuses?: LLMThreadStatus[],
  ): Promise<number> {
    const where: FindOptionsWhere<LLMThread> = {
      workspaceId,
      userId,
    };

    if (statuses && statuses.length > 0) {
      where.status = statuses.length === 1 ? statuses[0] : In(statuses);
    }

    return this.threadRepository.count({ where });
  }

  /**
   * Find threads not associated with any project
   *
   * @param {string} userId - ID of the user
   * @param {LLMThreadStatus[]} statuses - Optional array of statuses to filter by
   * @param {number} limit - Maximum number of threads to return (default: 20)
   * @param {number} offset - Number of threads to skip (default: 0)
   * @returns {Promise<LLMThread[]>} Array of threads without project association
   */
  async findUnassociatedThreads(
    userId: string,
    statuses?: LLMThreadStatus[],
    limit: number = 20,
    offset: number = 0,
  ): Promise<LLMThread[]> {
    const where: FindOptionsWhere<LLMThread> = {
      userId,
      workspaceId: null as any,
    };

    if (statuses && statuses.length > 0) {
      where.status = statuses.length === 1 ? statuses[0] : In(statuses);
    }

    return this.threadRepository.find({
      where,
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
