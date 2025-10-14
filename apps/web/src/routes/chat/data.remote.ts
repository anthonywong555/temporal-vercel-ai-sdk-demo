import { command } from '$app/server';
import { connectToTemporal } from "@temporal-vercel-demo/durable-execution";
import { ChatCreateRequestSchema, GENERAL_TASK_QUEUE } from "@temporal-vercel-demo/common";
import { env } from "$env/dynamic/private";

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