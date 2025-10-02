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

export async function prompt(request: PromptRequest): Promise<string> {
  const { prompt } = request;
  
  const result = await chainActivities({
    activities: [
      () => openaiGenerateText.executeWithOptions({
        summary: 'OpenAI.GenerateText',
      }, [{
        model: 'gpt-4o-mini',
        prompt
      }]),
      () => anthropicGenerateText.executeWithOptions({
        summary: 'Anthropic.GenerateText'
      }, [{
        model: 'claude-3-7-sonnet-20250219',
        prompt
      }])
    ]
  })

  return result?.steps[0]?.content[0]?.text;
}