import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatAgentGateway } from './chat-agent.gateway';
import { ChatAgentController } from './chat-agent.controller';
import { ChatAgentService } from './chat-agent.service';
import { LLMThreadService } from '../../shared/database/services/llm-thread.service';
import { LLMMessageService } from '../../shared/database/services/llm-message.service';
import { LLMThread } from '../../shared/database/entities/llm-thread.entity';
import { LLMMessage } from '../../shared/database/entities/llm-message.entity';
import { UserService } from '../../shared/database/services/user.service';
import { User } from '../../shared/database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

/**
 * Chat Agent Module
 *
 * This module provides WebSocket-based chat functionality with LLM integration.
 * It includes:
 * - WebSocket gateway for real-time communication
 * - Services for chat logic and database operations
 * - JWT authentication for secure connections
 * - Database entities and repositories
 */
@Module({
  imports: [
    // Import TypeORM entities
    TypeOrmModule.forFeature([LLMThread, LLMMessage, User]),

    // Import AuthModule to get JWT services and guards
    AuthModule,
  ],

  controllers: [ChatAgentController],

  providers: [
    ChatAgentGateway,
    ChatAgentService,
    LLMThreadService,
    LLMMessageService,
  ],

  exports: [ChatAgentService, LLMThreadService, LLMMessageService],
})
export class ChatAgentModule {}
