import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { context, metrics, trace } from '@opentelemetry/api';
import { Request, Response } from 'express';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { PinoLoggerService } from 'src/logger/pino-logger.service';

const meter = metrics.getMeter('kaarya-backend-monitoring');

const requestCounter = meter.createCounter('kaarya_http_server_requests', {
  description: 'Total number of HTTP requests',
});

const errorCounter = meter.createCounter('kaarya_http_server_errors', {
  description: 'Total number of HTTP requests that failed',
});

const requestDuration = meter.createHistogram(
  'kaarya_http_server_request_duration_ms',
  {
    description: 'HTTP request duration in milliseconds',
    unit: 'ms',
  },
);

@Injectable()
export class HttpObservabilityInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: PinoLoggerService) {}

  intercept(contextHost: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (contextHost.getType() !== 'http') {
      return next.handle();
    }

    const http = contextHost.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const method = request.method;
    const route = resolveRoute(request);
    const startedAt = process.hrtime.bigint();
    const requestId = extractRequestId(request.headers['x-request-id']);
    const spanContext = trace.getSpan(context.active())?.spanContext();

    let statusCode = response.statusCode || 200;
    let capturedError: unknown;

    return next.handle().pipe(
      catchError((error: unknown) => {
        capturedError = error;
        statusCode = resolveStatusCode(error, response.statusCode);
        return throwError(() => error);
      }),
      finalize(() => {
        if (!capturedError) {
          statusCode = response.statusCode || statusCode || 200;
        }

        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const attributes = {
          'http.method': method,
          'http.route': route,
          'http.status_code': statusCode,
        };

        requestCounter.add(1, attributes);
        requestDuration.record(durationMs, attributes);

        if (statusCode >= 500 || capturedError) {
          errorCounter.add(1, attributes);
        }

        const logger = this.loggerService.getLogger();
        const logPayload = {
          method,
          route,
          statusCode,
          durationMs: Number(durationMs.toFixed(2)),
          ...(requestId ? { requestId } : {}),
          ...(spanContext
            ? {
                traceId: spanContext.traceId,
                spanId: spanContext.spanId,
              }
            : {}),
        };

        if (capturedError) {
          logger.error(logPayload, 'HTTP request failed');
          return;
        }

        logger.info(logPayload, 'HTTP request completed');
      }),
    );
  }
}

function resolveRoute(request: Request): string {
  const routePath = request.route?.path;
  if (typeof routePath === 'string') {
    return `${request.baseUrl || ''}${routePath}` || request.path || request.url;
  }

  return request.path || request.url;
}

function resolveStatusCode(error: unknown, fallbackStatusCode?: number): number {
  if (error instanceof HttpException) {
    return error.getStatus();
  }

  return fallbackStatusCode && fallbackStatusCode > 0 ? fallbackStatusCode : 500;
}

function extractRequestId(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value[0];
  return value;
}
