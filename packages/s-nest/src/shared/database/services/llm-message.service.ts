import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LLMMessage } from '../entities/llm-message.entity';
import {
  LLMMessageRole,
  CreateLLMMessageRequest,
  UpdateLLMMessageRequest,
} from '@sansa-dev/s-shared';
import { UnifiedMessage } from 'src/shared/ai-providers';

/**
 * Service for managing LLM chat messages
 *
 * Provides CRUD operations and business logic for chat messages.
 * Handles message creation, updates, retrieval, and deletion.
 */
@Injectable()
export class LLMMessageService {
  constructor(
    @InjectRepository(LLMMessage)
    private readonly messageRepository: Repository<LLMMessage>,
  ) {}

  /**
   * Create a new LLM message
   *
   * @param {CreateLLMMessageRequest} request - Message creation request
   * @returns {Promise<LLMMessage>} The created message
   */
  async createMessage(
    request: CreateLLMMessageRequest & { status?: 'pending' | 'completed' },
  ): Promise<LLMMessage> {
    const message = this.messageRepository.create({
      threadId: request.threadId,
      role: request.role,
      content: request.content,
      status:
        request.status ||
        (request.role === 'assistant' ? 'pending' : 'completed'),
      model: request.model,
      provider: request.provider,
      tokenCountInput: request.tokenCountInput,
      tokenCountOutput: request.tokenCountOutput,
      tokenCostInput: request.tokenCostInput,
      tokenCostOutput: request.tokenCostOutput,
      messageCost: request.messageCost,
    });

    return this.messageRepository.save(message);
  }

  /**
   * Find a message by ID
   *
   * @param {string} messageId - ID of the message to find
   * @returns {Promise<LLMMessage | null>} The found message or null
   */
  async findById(messageId: string): Promise<LLMMessage | null> {
    return this.messageRepository.findOne({
      where: { id: messageId },
    });
  }

  /**
   * Find messages by thread ID
   *
   * @param {string} threadId - ID of the thread
   * @param {number} limit - Maximum number of messages to return (default: 50)
   * @param {number} offset - Number of messages to skip (default: 0)
   * @returns {Promise<LLMMessage[]>} Array of messages
   */
  async findByThread(
    threadId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<LLMMessage[]> {
    return this.messageRepository.find({
      where: { threadId },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Find the latest messages in a thread
   *
   * @param {string} threadId - ID of the thread
   * @param {number} limit - Maximum number of messages to return (default: 10)
   * @returns {Promise<LLMMessage[]>} Array of latest messages
   */
  async findLatestByThread(
    threadId: string,
    limit: number = 10,
  ): Promise<LLMMessage[]> {
    const messages = await this.messageRepository.find({
      where: { threadId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    // Return in chronological order (oldest first)
    return messages.reverse();
  }

  /**
   * Update a message
   *
   * @param {string} messageId - ID of the message to update
   * @param {UpdateLLMMessageRequest} request - Update request with new token count fields
   * @returns {Promise<LLMMessage | null>} The updated message or null if not found
   */
  async updateMessage(
    messageId: string,
    request: UpdateLLMMessageRequest,
  ): Promise<LLMMessage | null> {
    const message = await this.findById(messageId);

    if (!message) {
      return null;
    }

    if (request.content !== undefined) {
      message.content = request.content;
    }

    if (request.status !== undefined) {
      message.status = request.status;
    }

    if (request.model !== undefined) {
      message.model = request.model;
    }

    if (request.provider !== undefined) {
      message.provider = request.provider;
    }

    if (request.tokenCountInput !== undefined) {
      message.tokenCountInput = request.tokenCountInput;
    }

    if (request.tokenCountOutput !== undefined) {
      message.tokenCountOutput = request.tokenCountOutput;
    }

    if (request.tokenCostInput !== undefined) {
      message.tokenCostInput = request.tokenCostInput;
    }

    if (request.tokenCostOutput !== undefined) {
      message.tokenCostOutput = request.tokenCostOutput;
    }

    if (request.messageCost !== undefined) {
      message.messageCost = request.messageCost;
    }

    return this.messageRepository.save(message);
  }

  /**
   * Update message content
   *
   * @param {string} messageId - ID of the message to update
   * @param {string} content - New content for the message
   * @returns {Promise<LLMMessage | null>} The updated message or null if not found
   */
  async updateContent({
    messageId,
    content,
  }: {
    messageId: string;
    content: string;
  }): Promise<LLMMessage | null> {
    const result = await this.messageRepository.update(
      { id: messageId },
      { content },
    );

    if (result.affected && result.affected > 0) {
      return this.findById(messageId);
    }

    return null;
  }

  /**
   * Mark a message as completed
   *
   * @param {string} messageId - ID of the message to mark as completed
   * @returns {Promise<LLMMessage | null>} The updated message or null if not found
   */
  async markCompleted(messageId: string): Promise<LLMMessage | null> {
    const result = await this.messageRepository.update(
      { id: messageId },
      { status: 'completed' },
    );

    if (result.affected && result.affected > 0) {
      return this.findById(messageId);
    }

    return null;
  }

  /**
   * Mark a message as failed
   *
   * @param {string} messageId - ID of the message to mark as failed
   * @returns {Promise<LLMMessage | null>} The updated message or null if not found
   */
  async markFailed(messageId: string): Promise<LLMMessage | null> {
    const result = await this.messageRepository.update(
      { id: messageId },
      { status: 'failed' },
    );

    if (result.affected && result.affected > 0) {
      return this.findById(messageId);
    }

    return null;
  }

  /**
   * Delete a message
   *
   * @param {string} messageId - ID of the message to delete
   * @returns {Promise<boolean>} True if message was deleted, false otherwise
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    const result = await this.messageRepository.delete({ id: messageId });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Delete all messages in a thread
   *
   * @param {string} threadId - ID of the thread
   * @returns {Promise<number>} Number of messages deleted
   */
  async deleteByThread(threadId: string): Promise<number> {
    const result = await this.messageRepository.delete({ threadId });
    return result.affected || 0;
  }

  /**
   * Count messages in a thread
   *
   * @param {string} threadId - ID of the thread
   * @param {LLMMessageRole[]} roles - Optional array of roles to filter by
   * @returns {Promise<number>} Count of messages
   */
  async countByThread(
    threadId: string,
    roles?: LLMMessageRole[],
  ): Promise<number> {
    const where: any = { threadId };

    if (roles && roles.length > 0) {
      where.role = roles.length === 1 ? roles[0] : In(roles);
    }

    return this.messageRepository.count({ where });
  }

  /**
   * Find pending messages in a thread
   *
   * @param {string} threadId - ID of the thread
   * @returns {Promise<LLMMessage[]>} Array of pending messages
   */
  async findPendingByThread(threadId: string): Promise<LLMMessage[]> {
    return this.messageRepository.find({
      where: { threadId, status: 'pending' },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get the last message from a thread
   *
   * @param {string} threadId - ID of the thread
   * @returns {Promise<LLMMessage | null>} The last message or null if no messages
   */
  async getLastMessage(threadId: string): Promise<LLMMessage | null> {
    return this.messageRepository.findOne({
      where: { threadId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Convert messages to the format expected by the unified LLM service
   *
   * @param {LLMMessage[]} messages - Array of messages to convert
   * @returns {Array<{role: string, content: string}>} Converted messages
   */
  convertToLLMFormat(messages: LLMMessage[]): UnifiedMessage[] {
    return messages
      .filter((message) => message.status === 'completed') // Only include completed messages
      .map((message) => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: message.content,
      }));
  }
}
