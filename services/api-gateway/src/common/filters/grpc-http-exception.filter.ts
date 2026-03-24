import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { Request, Response } from 'express';
import { I18nContext } from 'nestjs-i18n';

type GrpcLikeError = {
  code?: number;
  details?: string;
  message?: string;
  name?: string;
};

@Catch()
export class GrpcHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const i18n = I18nContext.current(host);

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();

      // Translate string payloads that look like i18n keys
      if (typeof payload === 'string') {
        const translated = this.tryTranslate(payload, i18n);
        response.status(statusCode).json({
          statusCode,
          message: translated,
          timestamp: new Date().toISOString(),
          path: request.url,
        });
        return;
      }

      // Translate message field in object payloads
      if (typeof payload === 'object' && payload !== null) {
        const obj = payload as Record<string, unknown>;
        if (typeof obj.message === 'string') {
          obj.message = this.tryTranslate(obj.message, i18n);
        }
        response.status(statusCode).json(obj);
        return;
      }

      response.status(statusCode).json(payload);
      return;
    }

    const grpcError = exception as GrpcLikeError;

    if (grpcError?.name === 'TimeoutError') {
      response.status(HttpStatus.GATEWAY_TIMEOUT).json({
        statusCode: HttpStatus.GATEWAY_TIMEOUT,
        message: this.tryTranslate('general.upstream_timeout', i18n),
        error: 'Gateway Timeout',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
      return;
    }

    const grpcCode = grpcError?.code;

    if (typeof grpcCode !== 'number') {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: this.tryTranslate('general.internal_error', i18n),
        error: 'Internal Server Error',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
      return;
    }

    const statusCode = this.mapGrpcCodeToHttpStatus(grpcCode);
    const rawMessage =
      grpcError?.details || grpcError?.message || 'general.internal_error';
    const sanitized = this.sanitizeGrpcMessage(rawMessage);
    const message = this.tryTranslate(sanitized, i18n);

    response.status(statusCode).json({
      statusCode,
      message,
      error: this.getHttpErrorName(statusCode),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private tryTranslate(
    key: string,
    i18n: I18nContext | undefined,
  ): string {
    if (!i18n) return key;

    // Only attempt translation if the key looks like an i18n key (e.g. "auth.invalid_credentials")
    if (/^[a-z]+\.[a-z_]+$/i.test(key)) {
      const translated = i18n.t(`messages.${key}`);
      // If the translation returns the key itself, it means no translation was found
      if (translated !== `messages.${key}`) {
        return translated;
      }
    }
    return key;
  }

  private mapGrpcCodeToHttpStatus(code: number): HttpStatus {
    const grpcToHttp: Record<number, HttpStatus> = {
      [GrpcStatus.INVALID_ARGUMENT]: HttpStatus.BAD_REQUEST,
      [GrpcStatus.NOT_FOUND]: HttpStatus.NOT_FOUND,
      [GrpcStatus.ALREADY_EXISTS]: HttpStatus.CONFLICT,
      [GrpcStatus.PERMISSION_DENIED]: HttpStatus.FORBIDDEN,
      [GrpcStatus.RESOURCE_EXHAUSTED]: HttpStatus.TOO_MANY_REQUESTS,
      [GrpcStatus.FAILED_PRECONDITION]: HttpStatus.BAD_REQUEST,
      [GrpcStatus.ABORTED]: HttpStatus.CONFLICT,
      [GrpcStatus.OUT_OF_RANGE]: HttpStatus.BAD_REQUEST,
      [GrpcStatus.UNIMPLEMENTED]: HttpStatus.NOT_IMPLEMENTED,
      [GrpcStatus.INTERNAL]: HttpStatus.INTERNAL_SERVER_ERROR,
      [GrpcStatus.UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
      [GrpcStatus.DATA_LOSS]: HttpStatus.INTERNAL_SERVER_ERROR,
      [GrpcStatus.UNAUTHENTICATED]: HttpStatus.UNAUTHORIZED,
      [GrpcStatus.DEADLINE_EXCEEDED]: HttpStatus.GATEWAY_TIMEOUT,
    };

    return grpcToHttp[code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getHttpErrorName(statusCode: number): string {
    const names: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
      [HttpStatus.NOT_IMPLEMENTED]: 'Not Implemented',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
      [HttpStatus.GATEWAY_TIMEOUT]: 'Gateway Timeout',
    };

    return names[statusCode] ?? 'Internal Server Error';
  }

  private sanitizeGrpcMessage(message: string): string {
    // Example input: "16 UNAUTHENTICATED: Invalid credentials"
    return message.replace(/^\d+\s+[A-Z_]+:\s*/i, '').trim();
  }
}

