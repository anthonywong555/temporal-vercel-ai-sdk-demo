import { ApplicationFailure, proxyActivities } from '@temporalio/workflow';
import { GENERAL_TASK_QUEUE, ANTHROPIC_TASK_QUEUE, OPEN_AI_TASK_QUEUE, WeatherSchema, AttractionsSchema } from '@temporal-vercel-demo/common';
import { createAIActivities } from "@temporal-vercel-demo/ai";
import * as toolActivities from "@temporal-vercel-demo/tools";
import { type ModelMessage, type GenerateTextResult } from "ai";
import { z } from "zod/v4";
import { chainActivities } from "../utils";

const activityMap = proxyActivities<typeof toolActivities>({
  startToCloseTimeout: '2 minute',
  taskQueue: GENERAL_TASK_QUEUE,
  retry: {
    maximumAttempts: 5
  }
}) as unknown as Record<string, (...args: any[]) => Promise<any>>;


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
  try {

    // 💬 Messages
    const messages:ModelMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful ai agent.'
      },
      {
        role: 'user',
        content: 'What is the weather in San Francisco and what should I do?'
      }
    ];

    // 🛠️ Tools
    const tools = {
      weather: {
        description: 'Get the weather in a location',
        inputSchema: z.toJSONSchema(WeatherSchema)
      },
      attractions: {
        description: "Get the attractions in a location",
        inputSchema: z.toJSONSchema(AttractionsSchema)
      }
    }

    while(true) {
      const agentResponse:GenerateTextResult<any, never> = await chainActivities({
        activities: [
          () => openaiGenerateText.executeWithOptions({
            summary: 'OpenAI.GenerateText',
          }, [{
            model: 'gpt-4o-mini',
            messages,
            tools
          }]),
          () => anthropicGenerateText.executeWithOptions({
            summary: 'Anthropic.GenerateText'
          }, [{
            model: 'claude-3-7-sonnet-20250219',
            messages,
            tools
          }])
        ]
      });

      // Add LLM generated messages to the message history
      messages.push(...agentResponse?.steps[0]?.response?.messages);

      // Assuming it's the first steps
      //agentText = agentResponse?.steps[0]?.text;
      const { finishReason } = agentResponse?.steps[0];

      if(finishReason === 'tool-calls') {
        // Schedule Activities
        //const toolCalls = agentResponse?.steps[0]?.content[0]?
        for(const content of agentResponse?.steps[0]?.content) {
          const { type } = content;

          if(type === 'tool-call') {
            const { toolName, toolCallId, input } = content;
            const activity = activityMap[toolName];
            const toolResult = await activity(input);
            messages.push({
              role: 'tool',
              content: [{
                toolName,
                toolCallId,
                type: 'tool-result',
                output: {
                  type: 'json',
                  value: toolResult
                }
              }]
            });
          }
        }
      } else {
        // Exit the loop when the model doesn't request to use any more tools
        break;
      }
    }
  } catch(e) {
    throw new ApplicationFailure('');
  }
};