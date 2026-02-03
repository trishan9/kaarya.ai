import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RESPONSE_STATUS } from 'src/common/utils/api-response';
import { RESPONSE_MESSAGES } from 'src/constants/messages.constants';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR;
    let errors: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        const data = res as { message?: unknown; errors?: unknown };
        if (typeof data.message === 'string') {
          message = data.message;
        } else if (Array.isArray(data.message)) {
          message = data.message.join(', ');
          errors = data.message;
        } else if (data.message) {
          message = String(data.message);
        }
        if (data.errors !== undefined) {
          errors = data.errors;
        }
      }
    }

    response.status(status).json({
      success: RESPONSE_STATUS.ERROR,
      message,
      ...(errors !== undefined ? { errors } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
