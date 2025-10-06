import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

/**
 * Interceptor that logs HTTP requests after they've been processed by guards
 * This ensures we only log requests that weren't blocked by rate limiting
 */
@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body } = request;

    // Log the incoming request
    this.logger.debug(
      `🔵 Incoming Request: Body: ${JSON.stringify(body, null, 2)}\n`,
    );

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const duration = Date.now() - now;

        // Log the response
        this.logger.debug(
          `🟢 Response Sent:\n📍 ${method} ${url}\n⏱️ Duration: ${duration}ms\n📊 Status: ${
            response.statusCode
          }\n📦 Content-Length: ${response.get('content-length')}\n`,
        );
      }),
    );
  }
}
