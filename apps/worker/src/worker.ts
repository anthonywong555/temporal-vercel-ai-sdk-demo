import 'dotenv/config';
import { otelSdk, resource, traceExporter } from './instrumentation';
import { createLogger } from './logging';
import { 
  getEnv, 
  GENERAL_TASK_QUEUE,
  ENV_KEY_TEMPORAL_NAMESPACE,
  DEFAULT_TEMPORAL_NAMESPACE,
} from '@boilerplate/common';
import { getConnectionOptions } from '@boilerplate/temporalio';
import { getWorkflowOptions, withOptionalStatusServer } from './env';
import * as activities from './sharable-activities';
import { DefaultLogger, NativeConnection, Runtime, Worker, makeTelemetryFilterString } from '@temporalio/worker';
import {
  OpenTelemetryActivityInboundInterceptor,
  OpenTelemetryActivityOutboundInterceptor,
  makeWorkflowExporter,
} from '@temporalio/interceptors-opentelemetry/lib/worker';

const winstonLogger = createLogger({
  isProduction: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'preview',
  logFilePath: process.env.WORKER_LOG_PATH || '/var/logs/worker.log',
});

async function run() {
  try {
    Runtime.install({
      logger: new DefaultLogger('INFO', (entry) => {
        winstonLogger.log({
          label: entry.meta?.activityId ? 'activity' : entry.meta?.workflowId ? 'workflow' : 'worker',
          level: entry.level.toLowerCase(),
          message: entry.message,
          timestamp: new Date(Number(entry.timestampNanos / 1_000_000n)).toISOString(),
          ...entry.meta,
        });
      }),
      telemetryOptions: {
        logging: {
          forward: {},
          filter: makeTelemetryFilterString({ core: 'INFO' }),
        },
      }
    });
    
    const { env } = process;
    const NODE_ENV = getEnv(env, 'NODE_ENV');
    const isProd = NODE_ENV === 'production' || NODE_ENV === 'preview'
    
    console.info(`🤖: Node_ENV = ${NODE_ENV}`);
    console.info('🤖: Temporal Worker Coming Online...');
    
    const connectionOptions = await getConnectionOptions(env);

    const connection = await NativeConnection.connect(connectionOptions);
    const namespace = getEnv(env, ENV_KEY_TEMPORAL_NAMESPACE, DEFAULT_TEMPORAL_NAMESPACE);

    const workers: Worker[] = await Promise.all([
      // General
      Worker.create({
        connection,
        namespace,
        taskQueue: GENERAL_TASK_QUEUE,
        activities: {
          ...activities,
        },
        ...getWorkflowOptions(),
        sinks: traceExporter && {
          exporter: makeWorkflowExporter(traceExporter, resource),
        },
        interceptors: traceExporter && {
          ...(isProd === false && {
            workflowModules: [require.resolve('./workflows/index')]
          }),
          activity: [
            (ctx) => ({
              inbound: new OpenTelemetryActivityInboundInterceptor(ctx),
              outbound: new OpenTelemetryActivityOutboundInterceptor(ctx),
            }),
          ],
        },
      }),
    ]);

    await Promise.all(workers.map(async (aWorker) => {
      const {taskQueue} = aWorker.options;
      let port = '7002';

      return await withOptionalStatusServer(aWorker, parseInt(port), async () => {
        try {
          console.info(`🤖: Temporal ${aWorker.options.taskQueue} Online! Beep Boop Beep!`);
          await aWorker.run();
        } finally {
          await connection.close();
          await otelSdk.shutdown();
        }
      });
    }));
  } catch (e) {
    console.error('🤖: ERROR!', e);
  }
}

run().catch((err) => {
  winstonLogger.error('Process failed', err);
  process.exit(1);
});