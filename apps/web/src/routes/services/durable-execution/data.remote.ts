import { command, query } from '$app/server';
import { getEnv, UpdateRequest, UpdateWithStartRequest } from "@temporal-vercel-demo/common";
import { connectToTemporal, getConnectionOptions } from "@temporal-vercel-demo/durable-execution";
import { ChatCreateRequestSchema, GENERAL_TASK_QUEUE, CreateWorkflowRequest } from "@temporal-vercel-demo/common";
import { env } from "$env/dynamic/private";
import { Connection, WithStartWorkflowOperation } from '@temporalio/client';
import { db } from "$lib/server/db";
import { ConversationSchema, MessageSchema } from "@temporal-vercel-demo/database";

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

export const update = command(UpdateRequest, async(something) => {
  const { id, updateDef, updateArgs } = something;
  const client = await connectToTemporal(env);

  const handle = await client.workflow.getHandle(id);
  return await handle.executeUpdate(updateDef, {
    args: [updateArgs]
  });
})

export const updateWithStart = command(UpdateWithStartRequest, async(updateWithStartRequest) => {
  const { id, workflowType, workflowArgs, updateDef, updateArgs } = updateWithStartRequest;
  await db.insert(ConversationSchema)
    .values({
      id,
      state: 'active',
      title: `${workflowType}-${id.substring(0, 4)}`
    });
  //const { id, workflowType, workflowArgs, updateDef, updateArgs } = updateWithStartRequest;
  const client = await connectToTemporal(env);

  try {
    const startWorkflowOperation = new WithStartWorkflowOperation(workflowType, {
      workflowId: id,
      args: [workflowArgs],
      taskQueue: GENERAL_TASK_QUEUE,
      workflowIdConflictPolicy: 'FAIL',
    });
    const handle = await client.workflow.startUpdateWithStart(updateDef, {
      args: [updateArgs],
      waitForStage: 'ACCEPTED',
      startWorkflowOperation
    });

    return await handle.result();
  } catch(e) {
    console.error(e);
  }
})