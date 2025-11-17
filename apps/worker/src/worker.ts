import 'dotenv/config';
import { otelSdk, resource, traceExporter } from './instrumentation';
import { createLogger } from './logging';
import { 
  getEnv, 
  GENERAL_TASK_QUEUE,
  ENV_KEY_TEMPORAL_NAMESPACE,
  DEFAULT_TEMPORAL_NAMESPACE,
  OPEN_AI_TASK_QUEUE,
  ANTHROPIC_TASK_QUEUE
} from '@temporal-vercel-demo/common';
import { getConnectionOptions } from '@temporal-vercel-demo/durable-execution';
import { getWorkflowOptions, withOptionalStatusServer } from './env';
import { DefaultLogger, NativeConnection, Runtime, Worker, makeTelemetryFilterString } from '@temporalio/worker';
import {
  OpenTelemetryActivityInboundInterceptor,
  OpenTelemetryActivityOutboundInterceptor,
  makeWorkflowExporter,
} from '@temporalio/interceptors-opentelemetry/lib/worker';

import { createAIActivities, AIClient, PROVIDER_OPEN_AI, PROVIDER_ANTHROPIC } from '@temporal-vercel-demo/ai';
import * as toolsActivities from "@temporal-vercel-demo/activities";
import { createDrizzleActivites, DrizzleClient } from '@temporal-vercel-demo/database';

const winstonLogger = createLogger({
  isProduction: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'preview',
  logFilePath: process.env.WORKER_LOG_PATH || '/var/logs/worker.log',
});

async function run() {
  try {
    /*
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
    */
    
    const { env } = process;
    const NODE_ENV = getEnv(env, 'NODE_ENV');
    const isProd = NODE_ENV === 'production' || NODE_ENV === 'preview'
    
    console.info(`🤖: Node_ENV = ${NODE_ENV}`);
    console.info('🤖: Temporal Worker Coming Online...');
    
    const connectionOptions = await getConnectionOptions(env);

    const connection = await NativeConnection.connect(connectionOptions);
    const namespace = getEnv(env, ENV_KEY_TEMPORAL_NAMESPACE, DEFAULT_TEMPORAL_NAMESPACE);

    /* Activities Dependency Injection */

    // Drizzle
    const DATABASE_URL = getEnv(env, 'DATABASE_URL');
    const DRIZZLE_WORKER_PORT = getEnv(env, 'DRIZZLE_WORKER_PORT', '7002');
    const drizzleClient = new DrizzleClient(DATABASE_URL);

    // OpenAI
    const OPENAI_WORKER_PORT = getEnv(env, 'OPENAI_WORKER_PORT', '7013');
    const openAIClient = new AIClient(PROVIDER_OPEN_AI, drizzleClient);

    // Anthropic
    const ANTHROPIC_WORKER_PORT = getEnv(env, 'ANTHROPIC_WORKER_PORT', '7014');
    const anthropicAIClient = new AIClient(PROVIDER_ANTHROPIC, drizzleClient);

    const workers: Worker[] = await Promise.all([
      // General
      Worker.create({
        connection,
        namespace,
        taskQueue: GENERAL_TASK_QUEUE,
        activities: {
          ...toolsActivities,
          ...createDrizzleActivites(drizzleClient)
        },
        ...getWorkflowOptions(),
      }),

      // OpenAI
      await Worker.create({
        connection,
        namespace,
        taskQueue: OPEN_AI_TASK_QUEUE,
        activities: {...createAIActivities(openAIClient) },
      }),

      // Anthropic
      await Worker.create({
        connection,
        namespace,
        taskQueue: ANTHROPIC_TASK_QUEUE,
        activities: {...createAIActivities(anthropicAIClient) },
      })
    ]);

    await Promise.all(workers.map(async (aWorker) => {
      const {taskQueue} = aWorker.options;
      let port = '7002';

      if(taskQueue === OPEN_AI_TASK_QUEUE) {
        port = OPENAI_WORKER_PORT;
      } else if(taskQueue === ANTHROPIC_TASK_QUEUE) {
        port = ANTHROPIC_WORKER_PORT;
      }

      return await withOptionalStatusServer(aWorker, parseInt(port), async () => {
        try {
          console.info(`🤖: Temporal ${aWorker.options.taskQueue} Online! Beep Boop Beep!`);
          await aWorker.run();
        } finally {
          await connection.close();
          //await otelSdk.shutdown();
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