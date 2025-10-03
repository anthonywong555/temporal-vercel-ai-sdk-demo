import { proxyActivities } from '@temporalio/workflow';
import { ANTHROPIC_TASK_QUEUE, OPEN_AI_TASK_QUEUE, PromptRequest } from '@boilerplate/common';
import { createAIActivities } from "@boilerplate/ai";
import { chainActivities } from "../utils";

const { aiGenerateText: openaiGenerateText } = proxyActivities<ReturnType<typeof createAIActivities>>({
  scheduleToCloseTimeout: '2 minute',
  taskQueue: OPEN_AI_TASK_QUEUE,
  retry: {
    maximumAttempts: 3
  }
});

const { aiGenerateText: anthropicGenerateText } = proxyActivities<ReturnType<typeof createAIActivities>>({
  scheduleToCloseTimeout: '2 minute',
  taskQueue: ANTHROPIC_TASK_QUEUE,
  retry: {
    maximumAttempts: 3
  }
});

export async function toolCalling() {
  const messages = [
    
  ]
}