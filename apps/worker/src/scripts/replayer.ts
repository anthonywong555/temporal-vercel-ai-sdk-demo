import 'dotenv/config';
import { connectToTemporal } from "@temporal-vercel-demo/durable-execution";
import { Worker } from '@temporalio/worker';
import {
  OpenTelemetryActivityInboundInterceptor,
  OpenTelemetryActivityOutboundInterceptor,
} from '@temporalio/interceptors-opentelemetry/lib/worker';

async function run() {
  try {

    const { env } = process;
    const client = await connectToTemporal(env);
    const handle = client.workflow.getHandle('');
    const history = await handle.fetchHistory();

    await Worker.runReplayHistory(
      {
        workflowsPath: require.resolve('../workflows/index'),
        interceptors: {
          workflowModules: [require.resolve('../workflows/index')],
          activity: [
            (ctx) => ({
              inbound: new OpenTelemetryActivityInboundInterceptor(ctx),
              outbound: new OpenTelemetryActivityOutboundInterceptor(ctx),
            }),
          ],
        }
      },
      history
    );
  } catch (e) {
    console.error('🤖: ERROR!', e);
  }
}

run().catch((err) => {
  process.exit(1);
});