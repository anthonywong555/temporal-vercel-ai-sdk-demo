import type { RuntimeOptions, WorkerOptions } from "@temporalio/worker";
import { Worker} from '@temporalio/worker';
import { getEnv } from '@boilerplate/common';
import http from 'node:http';

export function getWorkflowOptions(): Pick<WorkerOptions, "workflowBundle" | "workflowsPath"> {
  const { env } = process;
  const NODE_ENV = getEnv(env, 'NODE_ENV');
  const workflowBundlePath = getEnv(env, 'WORKFLOW_BUNDLE_PATH', './dist/workflow-bundle.js');
  
  if (workflowBundlePath && (NODE_ENV === 'production' || NODE_ENV === 'preview')) {
    return { workflowBundle: { codePath: workflowBundlePath } };
  } else {
    return { workflowsPath: require.resolve('./workflows/index') };
  }
}

export function getTelemetryOptions(): RuntimeOptions {
  const { env } = process;
  const metrics = getEnv(env, "TEMPORAL_WORKER_METRIC", "");

  let telemetryOptions = {};

  switch(metrics) {
    case 'PROMETHEUS':
      const bindAddress = getEnv(env, 'TEMPORAL_METRICS_PROMETHEUS_ADDRESS', '0.0.0.0:9464');
      telemetryOptions = {
        metrics: {
          prometheus: {
            bindAddress,
          }
        }
      }
      console.info('🤖: Prometheus Metrics 🔥', bindAddress);
      break;
    case 'OTEL':
      telemetryOptions = {
        metrics : {
          otel: {
            url: getEnv(env, 'TEMPORAL_METRICS_OTEL_URL'),
            headers: {
              'api-key': getEnv(env, 'TEMPORAL_METRICS_OTEL_API_KEY')
            }
          }
        }
      }
      console.info('🤖: OTEL Metrics 📈');
      break;
    default:
      console.info('🤖: No Metrics');
      break;
  }
  
  return { telemetryOptions };
}

export async function withOptionalStatusServer(worker: Worker, port: number | undefined, fn: () => Promise<any>): Promise<void> {
  if (port == null) {
    await fn();
    return;
  }

  const server = await new Promise<http.Server>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.method !== 'GET') {
        res.writeHead(405, 'Method not allowed');
        res.end();
        return;
      }

      if (req.url !== '/') {
        res.writeHead(404, 'Not found');
        res.end();
        return;
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(worker.getStatus()));
      res.end();

      console.info(`Health Check ✅`);
    });
    server.listen(port, () => resolve(server));
    server.once('error', reject);
  });
  console.log(`${worker.options.taskQueue} Worker Status server listening on' ${port}`, server?.address());
  try {
    await fn();
  } finally {
    server.close();
  }
}