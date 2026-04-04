import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiError } from '../exceptions/api-error';
import { ErrorCodes } from '../exceptions/error-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const payload = this.normalizeException(exception, request.url);
    response.status(payload.statusCode).json(payload);
  }

  private normalizeException(exception: unknown, path: string) {
    const timestamp = new Date().toISOString();

    if (exception instanceof ApiError) {
      return {
        code: exception.code,
        message: exception.message,
        statusCode: exception.statusCode,
        details: exception.details ?? null,
        timestamp,
        path,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const responseBody =
        typeof exceptionResponse === 'string'
          ? { message: exceptionResponse }
          : (exceptionResponse as Record<string, unknown>);

      return {
        code: this.mapHttpStatusToCode(statusCode),
        message: typeof responseBody.message === 'string' ? responseBody.message : exception.message,
        statusCode,
        details: responseBody.message,
        timestamp,
        path,
      };
    }

    const error = exception instanceof Error ? exception : new Error('Unexpected error');
    this.logger.error(error.message, error.stack);

    return {
      code: ErrorCodes.INTERNAL_ERROR,
      message: '服务器内部错误',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      details: null,
      timestamp,
      path,
    };
  }

  private mapHttpStatusToCode(statusCode: number) {
    if (statusCode === HttpStatus.NOT_FOUND) {
      return ErrorCodes.RESOURCE_NOT_FOUND;
    }

    if (statusCode === HttpStatus.BAD_REQUEST || statusCode === HttpStatus.UNPROCESSABLE_ENTITY) {
      return ErrorCodes.VALIDATION_ERROR;
    }

    if (statusCode === HttpStatus.UNAUTHORIZED || statusCode === HttpStatus.FORBIDDEN) {
      return ErrorCodes.AUTH_REQUIRED;
    }

    return ErrorCodes.INTERNAL_ERROR;
  }
}
