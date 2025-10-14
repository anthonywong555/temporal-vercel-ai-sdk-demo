import { command, query } from '$app/server';
import { getEnv } from "@temporal-vercel-demo/common";
import { connectToTemporal, getConnectionOptions } from "@temporal-vercel-demo/durable-execution";
import { ChatCreateRequestSchema, GENERAL_TASK_QUEUE, CreateWorkflowRequest } from "@temporal-vercel-demo/common";
import { env } from "$env/dynamic/private";
import { Connection } from '@temporalio/client';

export const getStatus = query(async() => {
  // Doing a health check
  const conn = await Connection.connect(await getConnectionOptions(env));
  const response = await conn.healthService.check({});
  await conn.close();
  const healthCheck = JSON.parse(JSON.stringify(response));
  const { status } = healthCheck;

  return {
    status,
    canConnectToTemporal: status === 'SERVING',
    url: getEnv(env, 'TEMPORAL_BASE_URL', '')
  }
});

export const startWorkflow = command(CreateWorkflowRequest, async(createWorkflowRequest) => {
  const { id, workflowType, args } = createWorkflowRequest;

  const client = await connectToTemporal(env);
  const handle = await client.workflow.start(workflowType, {
    workflowId: id,
    taskQueue: GENERAL_TASK_QUEUE,
    args: [args]
  });

  return handle.result;
});

export const executeWorkflow = command(CreateWorkflowRequest, async (createWorkflowRequest) => {
  const { id, workflowType, args } = createWorkflowRequest;

  const client = await connectToTemporal(env);
  const result = await client.workflow.execute(workflowType, {
    workflowId: id,
    taskQueue: GENERAL_TASK_QUEUE,
    args: [args]
  });
  
  return result;
});

export const createChat = command(ChatCreateRequestSchema, async(chatCreateRequest) => {
  const { id, workflowType, prompt } = chatCreateRequest;
  const client = await connectToTemporal(env);
  const handle = await client.workflow.start(workflowType, {
    taskQueue: GENERAL_TASK_QUEUE,
    workflowId: id,
    args: [
      {prompt}
    ]
  });

  return handle.workflowId;
});