import {
  ChatMessageEvent,
  CreateLLMMessageRequest,
  CreateLLMThreadRequest,
  LLMMessageRole,
} from '@sansa-dev/shared';
import { Injectable, Logger } from '@nestjs/common';
import { OpenAIModel } from 'src/shared/ai-providers/constants/openai.constants';

import {
  UnifiedLLMRequest,
  UnifiedLLMService,
  UnifiedMessage,
  UnifiedStreamChunk,
} from '../../shared/ai-providers';
import { LLMMessage } from '../../shared/database/entities/llm-message.entity';
import { LLMThread } from '../../shared/database/entities/llm-thread.entity';
import { LLMMessageService } from '../../shared/database/services/llm-message.service';
import { LLMThreadService } from '../../shared/database/services/llm-thread.service';
import { getSystemPrompt } from './prompts';

/**
 * Service for managing Chat Agent functionality
 *
 * This service orchestrates the entire chat flow:
 * - Thread management (create, retrieve, update)
 * - Message handling (create, store, update)
 * - LLM integration (streaming responses)
 * - Context management (system prompts, conversation history)
 */
@Injectable()
export class ChatAgentService {
  private readonly logger = new Logger(ChatAgentService.name);
  private readonly unifiedLLMService: UnifiedLLMService;

  constructor(
    private readonly threadService: LLMThreadService,
    private readonly messageService: LLMMessageService,
  ) {
    this.unifiedLLMService = new UnifiedLLMService();
  }

  /**
   * Process a chat message event
   *
   * This is the main entry point for processing chat messages.
   * It handles thread creation/retrieval, message storage, and LLM interaction.
   *
   * @param {string} userId - ID of the user sending the message
   * @param {ChatMessageEvent} event - The chat message event (now includes uiState and isInitial)
   * @returns {Promise<{thread: LLMThread, userMessage: LLMMessage}>}
   */
  async processChatMessage({
    userId,
    event,
  }: {
    userId: string;
    event: ChatMessageEvent;
  }): Promise<{
    thread: LLMThread;
    userMessage: LLMMessage;
  }> {
    try {
      this.logger.debug(`Processing chat message for user ${userId}`);
      this.logger.debug(`Event: ${JSON.stringify(event)}`);

      if (!event.threadId) {
        throw new Error('Messages must include a threadId');
      }

      // Step 1: Get or create thread
      let thread: LLMThread;
      if (event.threadId) {
        thread = await this.getOrCreateThread({
          userId,
          threadId: event.threadId,
        });
        // Verify thread ownership
        if (thread.userId !== userId) {
          throw new Error('Thread access denied');
        }
      } else {
        // Determine message content for thread title generation
        const messageForTitle = event.message;
        thread = await this.createNewThread({
          userId,
          firstMessage: messageForTitle,
        });
      }

      // Step 2: Create and store user message
      // Use initial message if isInitial is true, otherwise use event message
      const userMessageContent = event.message;

      const userMessage = await this.createUserMessage({
        threadId: thread.id,
        content: userMessageContent,
        metadata: undefined, // ChatMessageEvent doesn't have metadata field
      });

      // Step 3: Update thread with new message count (only for user message)
      await this.threadService.updateLastMessage(thread.id);

      return {
        thread,
        userMessage,
      };
    } catch (error) {
      this.logger.error('Error processing chat message:', error);
      throw error;
    }
  }

  /**
   * Generate streaming response from LLM
   *
   * @param {string} userId - ID of the user
   * @param {string} threadId - ID of the thread
   * @param {string} userName - Name of the user (REQUIRED)
   * @param {string} uiState - The current UI state as a string (REQUIRED)
   * @param {boolean} isInitial - Whether this is an initial conversation starter
   * @param {boolean} coverState - Whether the cover screen is currently shown
   * @returns {AsyncGenerator<UnifiedStreamChunk>} Stream of LLM response chunks
   */
  async *generateStreamingResponse({
    userId,
    threadId,
    userName,
    uiState,
    isInitial = false,
    coverState = false,
  }: {
    userId: string;
    threadId: string;
    userName: string;
    uiState: string;
    isInitial?: boolean;
    coverState?: boolean;
  }): AsyncGenerator<UnifiedStreamChunk> {
    try {
      // Get thread with messages for context
      const thread = await this.threadService.findByIdWithMessages(
        threadId,
        userId,
        50,
      );

      this.logger.debug(`Thread: ${JSON.stringify(thread)}`);

      if (!thread) {
        throw new Error('Thread not found');
      }

      // Convert messages to LLM format
      const convertedMessages = this.messageService.convertToLLMFormat(
        thread.messages,
      );

      this.logger.debug(
        `Converted messages: ${JSON.stringify(convertedMessages)}`,
      );

      // Cast to UnifiedMessage type (convertToLLMFormat returns compatible structure)
      const unifiedMessages: UnifiedMessage[] = convertedMessages;

      // Get system prompt
      const systemPrompt = getSystemPrompt();

      // Create LLM request
      const request: UnifiedLLMRequest = {
        provider: 'openai',
        model: OpenAIModel.GPT_4O_MINI,
        messages: unifiedMessages,
        systemMessage: systemPrompt,
        stream: true,
        temperature: 0.7,
        maxTokens: 1000,
      };

      // Generate streaming response
      const stream = (await this.unifiedLLMService.createCompletion(
        request,
      )) as AsyncIterable<UnifiedStreamChunk>;

      for await (const chunk of stream) {
        // Yield the chunk to the WebSocket stream
        yield chunk;
      }

      this.logger.debug(
        `Streaming completed for user ${userId}, thread ${threadId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error generating streaming response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create a pending assistant message at the start of a stream.
   *
   * This creates a placeholder assistant message with empty content and
   * status set to 'pending'. The message can then be referenced by its
   * real database ID while the tokens stream in. On stream completion,
   * use {@link completeAssistantMessage} to finalize the content and
   * mark the message as 'completed'.
   *
   * Rationale:
   * - Provides a stable, unique `messageId` for all stream chunks
   * - Avoids writing partial content to the database
   * - Keeps incomplete assistant messages out of subsequent LLM context
   *   because {@link LLMMessageService.convertToLLMFormat} includes only
   *   messages with status 'completed'
   *
   * @param params - Parameters
   * @param params.threadId - The thread the assistant message belongs to
   * @returns The newly created pending assistant message
   */
  async createPendingAssistantMessage({
    threadId,
  }: {
    threadId: string;
  }): Promise<LLMMessage> {
    const request: CreateLLMMessageRequest = {
      threadId,
      role: 'assistant' as LLMMessageRole,
      content: '',
    };

    // Note: LLMMessageService.createMessage defaults assistant messages to
    // status 'pending' when no explicit status is provided.
    return this.messageService.createMessage(request);
  }

  /**
   * Complete a previously created pending assistant message.
   *
   * Updates the message content and marks the message as 'completed'.
   * This should be called exactly once when the model's streaming output
   * is finalized.
   *
   * @param params - Parameters
   * @param params.messageId - The ID of the pending assistant message
   * @param params.content - The final accumulated content to store
   * @returns The updated, now-completed assistant message
   */
  async completeAssistantMessage({
    messageId,
    content,
  }: {
    messageId: string;
    content: string;
  }): Promise<LLMMessage> {
    // Update the message content first
    const updated = await this.messageService.updateContent({
      messageId,
      content,
    });

    if (!updated) {
      throw new Error(`Assistant message ${messageId} not found for update`);
    }

    // Then mark as completed
    const completed = await this.messageService.markCompleted(messageId);
    if (!completed) {
      throw new Error(`Assistant message ${messageId} not found to complete`);
    }

    // Update thread metadata (e.g., lastMessageAt, messageCount)
    await this.threadService.updateLastMessage(completed.threadId);

    return completed;
  }

  /**
   * Mark a pending assistant message as failed.
   *
   * Used when streaming fails after a pending assistant message has already
   * been created. This prevents the message from remaining indefinitely in
   * 'pending' status.
   *
   * @param messageId - The ID of the assistant message to mark as failed
   */
  async markAssistantMessageFailed(messageId: string): Promise<void> {
    try {
      await this.messageService.markFailed(messageId);
    } catch (error) {
      this.logger.warn(
        `Could not mark assistant message ${messageId} as failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get thread for user with recent messages
   *
   * @param {string} threadId - ID of the thread
   * @param {string} userId - ID of the user
   * @param {number} messageLimit - Maximum number of messages to include
   * @returns {Promise<LLMThread | null>} Thread with messages or null
   */
  async getThreadWithMessages({
    threadId,
    userId,
    messageLimit = 20,
  }: {
    threadId: string;
    userId: string;
    messageLimit?: number;
  }): Promise<LLMThread | null> {
    return this.threadService.findByIdWithMessages(
      threadId,
      userId,
      messageLimit,
    );
  }

  /**
   * Get user's threads
   *
   * @param {string} userId - ID of the user
   * @param {number} limit - Maximum number of threads to return
   * @param {number} offset - Number of threads to skip
   * @returns {Promise<LLMThread[]>} Array of threads
   */
  async getUserThreads({
    userId,
    limit = 20,
    offset = 0,
  }: {
    userId: string;
    limit?: number;
    offset?: number;
  }): Promise<LLMThread[]> {
    return this.threadService.findByUser(
      userId,
      ['active', 'paused'],
      limit,
      offset,
    );
  }

  /**
   * Get or create thread
   *
   * @private
   * @param {string} userId - ID of the user
   * @param {string} threadId - ID of the thread to get
   * @returns {Promise<LLMThread>} The thread
   */
  private async getOrCreateThread({
    userId,
    threadId,
  }: {
    userId: string;
    threadId: string;
  }): Promise<LLMThread> {
    const thread = await this.threadService.findById(threadId, userId);

    if (!thread) {
      throw new Error(`Thread ${threadId} not found for user ${userId}`);
    }

    if (!thread.isActive()) {
      throw new Error(`Thread ${threadId} is not active`);
    }

    return thread;
  }

  /**
   * Gets a thread by ID, ensuring it belongs to the user
   *
   * @param threadId - The thread ID
   * @param userId - The user ID for ownership validation
   * @returns The thread
   */
  async getThread(threadId: string, userId: string): Promise<LLMThread> {
    return await this.threadService.findById(threadId, userId);
  }

  /**
   * Create a new thread
   *
   * @private
   * @param {string} userId - ID of the user
   * @param {string} firstMessage - First message content for title generation
   * @returns {Promise<LLMThread>} The created thread
   */
  private async createNewThread({
    userId,
    firstMessage,
  }: {
    userId: string;
    firstMessage: string;
  }): Promise<LLMThread> {
    const request: CreateLLMThreadRequest = {
      title: LLMThread.generateTitle(firstMessage),
    };

    return this.threadService.createThread(userId, request);
  }

  /**
   * Create a user message
   *
   * @private
   * @param {string} threadId - ID of the thread
   * @param {string} content - Message content
   * @param {Record<string, unknown>} metadata - Optional metadata
   * @returns {Promise<LLMMessage>} The created message
   */
  private async createUserMessage({
    threadId,
    content,
    metadata,
  }: {
    threadId: string;
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<LLMMessage> {
    const request: CreateLLMMessageRequest = {
      threadId,
      role: 'user' as LLMMessageRole,
      content,
      metadata,
    };

    return this.messageService.createMessage(request);
  }

  /**
   * Create and save final assistant message
   *
   * @param {string} threadId - ID of the thread
   * @param {string} content - Final accumulated content
   * @returns {Promise<LLMMessage>} The created assistant message
   */
  async createFinalAssistantMessage({
    threadId,
    content,
  }: {
    threadId: string;
    content: string;
  }): Promise<LLMMessage> {
    try {
      const request: CreateLLMMessageRequest = {
        threadId,
        role: 'assistant' as LLMMessageRole,
        content,
      };

      const assistantMessage = await this.messageService.createMessage({
        ...request,
        status: 'completed',
      });

      // Update thread message count
      await this.threadService.updateLastMessage(threadId);

      this.logger.debug(
        `Final assistant message created successfully: ${assistantMessage.id}`,
      );

      return assistantMessage;
    } catch (error) {
      this.logger.error(
        `Error creating final assistant message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }
}
