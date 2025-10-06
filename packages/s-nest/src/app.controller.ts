import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './shared/guards/jwt-auth.guard';

class HealthCheckResponse {
  status: string;
  timestamp: string;
}

@ApiTags('system')
@Controller()
export class AppController {
  @Get('/health') 
  @Public()
  @ApiOkResponse({
    type: HealthCheckResponse,
  })
  healthCheck(): HealthCheckResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
