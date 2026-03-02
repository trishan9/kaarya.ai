import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { config as loadEnv } from 'dotenv';

const globalTelemetry = globalThis as typeof globalThis & {
  __kaaryaTelemetrySdk?: NodeSDK;
};

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const isTestEnv = NODE_ENV === 'test';

if (!isTestEnv) {
  loadEnv();
}

const otelEnabled = parseBoolean(process.env.OTEL_ENABLED, false);

if (otelEnabled && !globalTelemetry.__kaaryaTelemetrySdk) {
  const diagLevel = getDiagLevel(process.env.OTEL_DIAG_LOG_LEVEL);
  if (diagLevel !== undefined) {
    diag.setLogger(new DiagConsoleLogger(), diagLevel);
  }

  const serviceName =
    process.env.OTEL_SERVICE_NAME || process.env.APP_NAME || 'kaarya-backend';
  const serviceVersion = process.env.OTEL_SERVICE_VERSION || '0.0.1';
  const baseEndpoint = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '').trim();

  const traceUrl =
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    appendPath(baseEndpoint, 'v1/traces');
  const metricsUrl =
    process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ||
    appendPath(baseEndpoint, 'v1/metrics');

  const metricExportIntervalMillis = parseInteger(
    process.env.OTEL_METRIC_EXPORT_INTERVAL_MS,
    60000,
  );

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
      'deployment.environment': NODE_ENV,
    }),
    traceExporter: traceUrl ? new OTLPTraceExporter({ url: traceUrl }) : undefined,
    metricReaders: metricsUrl
      ? [
          new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter({ url: metricsUrl }),
            exportIntervalMillis: metricExportIntervalMillis,
          }),
        ]
      : [],
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
      new NestInstrumentation(),
    ],
  });

  sdk.start();
  globalTelemetry.__kaaryaTelemetrySdk = sdk;

  const shutdownTelemetry = async () => {
    if (!globalTelemetry.__kaaryaTelemetrySdk) return;

    try {
      await globalTelemetry.__kaaryaTelemetrySdk.shutdown();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to shutdown OpenTelemetry', error);
    } finally {
      delete globalTelemetry.__kaaryaTelemetrySdk;
    }
  };

  process.once('SIGTERM', () => {
    void shutdownTelemetry();
  });
  process.once('SIGINT', () => {
    void shutdownTelemetry();
  });
}

function appendPath(baseEndpoint: string, path: string): string | undefined {
  if (!baseEndpoint) return undefined;
  return `${baseEndpoint.replace(/\/+$/, '')}/${path}`;
}

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (!value) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function parseInteger(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

function getDiagLevel(value: string | undefined): DiagLogLevel | undefined {
  if (!value) return undefined;

  const normalized = value.toLowerCase();
  const levels: Record<string, DiagLogLevel> = {
    all: DiagLogLevel.ALL,
    verbose: DiagLogLevel.VERBOSE,
    debug: DiagLogLevel.DEBUG,
    info: DiagLogLevel.INFO,
    warn: DiagLogLevel.WARN,
    error: DiagLogLevel.ERROR,
    none: DiagLogLevel.NONE,
  };

  return levels[normalized];
}
