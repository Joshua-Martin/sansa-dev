import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { ChatAgentService } from './chat-agent.service';
import { LLMThreadService } from '../../shared/database/services/llm-thread.service';
import { CreateLLMThreadRequest } from '@sansa-dev/shared';

/**
 * REST API Controller for Chat Agent
 *
 * Provides HTTP endpoints for chat agent functionality that doesn't require
 * real-time communication. Used for thread management and initial data loading.
 */
@Controller('chat-agent')
@UseGuards(JwtAuthGuard)
export class ChatAgentController {
  constructor(
    private readonly chatService: ChatAgentService,
    private readonly threadService: LLMThreadService,
  ) {}

  /**
   * Create a new thread
   *
   * @param req - Request object containing user information
   * @param body - Thread creation request
   * @returns The created thread
   */
  @Post('threads')
  async createThread(
    @Request() req: any,
    @Body() body: CreateLLMThreadRequest,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.threadService.createThread(userId, body);
  }

  /**
   * Get user's threads
   *
   * @param req - Request object containing user information
   * @param limit - Maximum number of threads to return
   * @param offset - Number of threads to skip
   * @returns Array of threads
   */
  @Get('threads')
  async getUserThreads(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.chatService.getUserThreads({
      userId,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });
  }

  /**
   * Get a specific thread with messages
   *
   * @param req - Request object containing user information
   * @param threadId - ID of the thread to retrieve
   * @param messageLimit - Maximum number of messages to include
   * @returns The thread with messages
   */
  @Get('threads/:threadId')
  async getThreadWithMessages(
    @Request() req: any,
    @Param('threadId') threadId: string,
    @Query('messageLimit') messageLimit?: number,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.chatService.getThreadWithMessages({
      threadId,
      userId,
      messageLimit: messageLimit ? Number(messageLimit) : 20,
    });
  }
}
