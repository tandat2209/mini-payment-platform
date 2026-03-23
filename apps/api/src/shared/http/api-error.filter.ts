import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { toStructuredLog } from '../logging/structured-log';

type ErrorResponseBody = {
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
};

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<{
      method?: string;
      originalUrl?: string;
      requestId?: string;
      url?: string;
    }>();
    const response = host.switchToHttp().getResponse<{
      status: (statusCode: number) => { json: (body: ErrorResponseBody) => void };
    }>();
    const method = request?.method ?? 'UNKNOWN';
    const path = request?.originalUrl ?? request?.url ?? 'UNKNOWN';
    const requestId = request?.requestId ?? null;

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();
      const message = this.extractMessage(payload, exception.message);
      const code = this.extractCode(payload, statusCode);
      const logMessage = toStructuredLog({
        code,
        event: 'http_request_failed',
        message,
        method,
        path,
        requestId,
        statusCode,
      });

      if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(logMessage, exception.stack);
      } else {
        this.logger.warn(logMessage);
      }

      response.status(statusCode).json({
        error: {
          code,
          message,
          statusCode,
        },
      });

      return;
    }

    const unexpectedError =
      exception instanceof Error
        ? exception
        : new Error(typeof exception === 'string' ? exception : 'Unexpected error');
    this.logger.error(
      toStructuredLog({
        code: 'INTERNAL_SERVER_ERROR',
        event: 'http_request_failed',
        message: unexpectedError.message,
        method,
        path,
        requestId,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      }),
      unexpectedError.stack,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    });
  }

  private extractCode(payload: unknown, statusCode: number): string {
    if (typeof payload === 'object' && payload !== null) {
      const errorValue = (payload as { error?: unknown }).error;

      if (typeof errorValue === 'string' && errorValue.trim().length > 0) {
        return errorValue.replace(/\s+/g, '_').toUpperCase();
      }
    }

    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      default:
        return 'HTTP_ERROR';
    }
  }

  private extractMessage(payload: unknown, fallback: string): string {
    if (typeof payload === 'string') {
      return payload;
    }

    if (typeof payload === 'object' && payload !== null) {
      const messageValue = (payload as { message?: unknown }).message;

      if (Array.isArray(messageValue)) {
        return messageValue.join(', ');
      }

      if (typeof messageValue === 'string' && messageValue.trim().length > 0) {
        return messageValue;
      }
    }

    return fallback;
  }
}
