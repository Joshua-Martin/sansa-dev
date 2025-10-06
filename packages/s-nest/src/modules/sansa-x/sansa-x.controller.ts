import {
  Controller,
  Post,
  Body,
  Logger,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SansaXService } from './sansa-x.service';
import { ApiKeyAuthenticatedRequest } from '../../shared/middleware/api-key.middleware';
import { LLMApiCallRecordService } from '../../shared/database/services/llm-api-call-record.service';
import {
  PreRequestPayload,
  PostResponsePayload,
} from '@sansa-dev/s-shared';

/**
 * DTOs for API documentation
 */
class ApiPreRequestPayload {
  id: string;
  name: string;
  promptVersion: string;
  model: string;
  provider: string;
  userPrompt: string;
  systemPrompt: string;
  timestamp: string;
}

class ApiPostResponsePayload {
  id: string;
  name: string;
  promptVersion: string;
  model: string;
  provider: string;
  userPrompt: string;
  systemPrompt: string;
  inputTokenCount: number;
  outputTokenCount: number;
  response?: string;
  timestamp: string;
  durationMs?: number;
  error?: {
    message: string;
    code?: string;
  };
}

class ApiMessageResponse {
  message: string;
}

/**
 * Sansa-X Data Ingestion Controller
 *
 * Handles incoming monitoring data from Sansa-X clients.
 * Requires API key authentication for all endpoints.
 */
@ApiTags('Sansa-X')
@Controller('sansa-x')
export class SansaXController {
  private readonly logger = new Logger(SansaXController.name);

  constructor(
    private readonly sansaXService: SansaXService,
    private readonly recordService: LLMApiCallRecordService,
  ) {}

  /**
   * Receive pre-request data from Sansa-X client
   *
   * This endpoint receives data about LLM API calls before they are made,
   * storing it temporarily until the corresponding post-response arrives.
   */
  @Post('pre-request')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Receive pre-request data from Sansa-X client',
    description: 'Stores pre-request data until the corresponding post-response is received',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pre-request data received successfully',
    type: ApiMessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing API key',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid payload data',
  })
  async handlePreRequest(
    @Body() payload: PreRequestPayload,
    // Note: The request object is extended by the middleware
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    req: ApiKeyAuthenticatedRequest,
  ): Promise<{ message: string }> {
    const appId = req.user.appId;

    await this.sansaXService.handlePreRequest(payload, appId);

    return { message: 'Pre-request data received successfully' };
  }

  /**
   * Receive post-response data from Sansa-X client
   *
   * This endpoint receives data about completed LLM API calls,
   * correlating it with stored pre-request data to create complete records.
   */
  @Post('post-response')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Receive post-response data from Sansa-X client',
    description: 'Correlates post-response data with pre-request data and creates complete API call records',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post-response data processed successfully',
    type: ApiMessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing API key',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid payload data',
  })
  async handlePostResponse(
    @Body() payload: PostResponsePayload,
    // Note: The request object is extended by the middleware
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    req: ApiKeyAuthenticatedRequest,
  ): Promise<{ message: string }> {
    const appId = req.user.appId;

    await this.sansaXService.handlePostResponse(payload, appId);

    return { message: 'Post-response data processed successfully' };
  }
}
