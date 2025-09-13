/**
 * Tool Server Module
 *
 * NestJS module for tool server communication
 */

import { Module } from '@nestjs/common';
import { DockerService } from '../../../shared/services/docker.service';
import { ToolServerService } from './tool-server.service';
import { ToolServerClient } from './tool-server-client';

@Module({
  providers: [ToolServerService, ToolServerClient, DockerService],
  exports: [ToolServerService, ToolServerClient],
})
export class ToolServerModule {}
