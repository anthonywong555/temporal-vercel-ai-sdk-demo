import 'dotenv/config';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter, SpanExporter } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { MetricReader, PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';

function setupTraceExporter(): SpanExporter | undefined {
  return new ConsoleSpanExporter();
}

function setupMetricReader(): MetricReader | undefined {
  return new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),
  });
}

export const resource = new Resource({
  [ATTR_SERVICE_NAME]: 'boilerplate',
});

export const traceExporter = setupTraceExporter();
const metricReader = setupMetricReader();

export const otelSdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  instrumentations: [getNodeAutoInstrumentations()],
});

otelSdk.start();