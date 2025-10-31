import { startDebugReplayer } from '@temporalio/worker';
import {
  OpenTelemetryActivityInboundInterceptor,
  OpenTelemetryActivityOutboundInterceptor,
  makeWorkflowExporter,
} from '@temporalio/interceptors-opentelemetry/lib/worker';

startDebugReplayer({
  workflowsPath: require.resolve('../src/workflows/index'),
  interceptors: {
    workflowModules: [require.resolve('../src/workflows/index')],
    activity: [
      (ctx) => ({
        inbound: new OpenTelemetryActivityInboundInterceptor(ctx),
        outbound: new OpenTelemetryActivityOutboundInterceptor(ctx),
      }),
    ],
  }
});