import { randomUUID } from 'node:crypto';

import {
  CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { finalize } from 'rxjs';

import { toStructuredLog } from '../logging/structured-log';

type HttpRequestView = {
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
  originalUrl?: string;
  requestId?: string;
  url?: string;
};

type HttpResponseView = {
  setHeader?: (name: string, value: string) => void;
  statusCode?: number;
};

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<'http'>() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<HttpRequestView>();
    const response = http.getResponse<HttpResponseView>();
    const requestId = getOrCreateRequestId(request.headers?.['x-request-id']);
    const method = request.method ?? 'UNKNOWN';
    const path = request.originalUrl ?? request.url ?? 'UNKNOWN';
    const startedAt = Date.now();

    request.requestId = requestId;
    response.setHeader?.('x-request-id', requestId);

    this.logger.log(
      toStructuredLog({
        event: 'http_request_started',
        method,
        path,
        requestId,
      }),
    );

    return next.handle().pipe(
      finalize(() => {
        this.logger.log(
          toStructuredLog({
            durationMs: Date.now() - startedAt,
            event: 'http_request_completed',
            method,
            path,
            requestId,
            statusCode: response.statusCode ?? 200,
          }),
        );
      }),
    );
  }
}

function getOrCreateRequestId(headerValue: string | string[] | undefined): string {
  if (typeof headerValue === 'string' && headerValue.trim().length > 0) {
    return headerValue.trim();
  }

  if (Array.isArray(headerValue) && headerValue[0]?.trim().length) {
    return headerValue[0].trim();
  }

  return randomUUID();
}
