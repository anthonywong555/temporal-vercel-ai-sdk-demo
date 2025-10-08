import { ApplicationFailure, proxyActivities, workflowInfo } from '@temporalio/workflow';
import { GENERAL_TASK_QUEUE, ANTHROPIC_TASK_QUEUE, 
    OPEN_AI_TASK_QUEUE, WeatherSchema, 
    AttractionsSchema, PromptRequest,
    USER_NAME, 
    TEMPORAL_BOT} from '@temporal-vercel-demo/common';
import { createAIActivities } from "@temporal-vercel-demo/ai";
import * as toolActivities from "@temporal-vercel-demo/tools";
import { type ModelMessage, type GenerateTextResult, type ToolContent } from "ai";
import { createDrizzleActivites } from "@temporal-vercel-demo/database";
import { z } from "zod/v4";
import { chainActivities } from "../utils";

const activityMap = proxyActivities<typeof toolActivities>({
  startToCloseTimeout: '2 minute',
  taskQueue: GENERAL_TASK_QUEUE,
  retry: {
    maximumAttempts: 5
  }
}) as unknown as Record<string, (...args: any[]) => Promise<any>>;


const { aiGenerateText: openaiGenerateText, aiStreamText: openaiStreamText } = proxyActivities<ReturnType<typeof createAIActivities>>({
  scheduleToCloseTimeout: '2 minute',
  taskQueue: OPEN_AI_TASK_QUEUE,
  retry: {
    maximumAttempts: 3
  }
});

const { aiGenerateText: anthropicGenerateText, aiStreamText: anthropicStreamText } = proxyActivities<ReturnType<typeof createAIActivities>>({
  scheduleToCloseTimeout: '2 minute',
  taskQueue: ANTHROPIC_TASK_QUEUE,
  retry: {
    maximumAttempts: 3
  }
});

const { createConversation, createMessage, upsertTool } = proxyActivities<ReturnType<typeof createDrizzleActivites>>({
  scheduleToCloseTimeout: '2 minute',
  retry: {
    maximumAttempts: 3
  }
});

export async function toolCalling(request: PromptRequest):Promise<string> {
  try {
    const { prompt } = request;
    // 💬 Messages
    const messages:ModelMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful ai agent.'
      },
      {
        role: 'user',
        content: prompt
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
    };

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
                  type: typeof toolResult === 'object' ? 'json' : 'text',
                  value: toolResult
                }
              }]
            });
          }
        }
      } else if(finishReason === 'error' || finishReason === 'unknown') {
        throw new ApplicationFailure();
      } else if(finishReason === 'stop') {
        // Exit the loop when the model doesn't request to use any more tools

        return agentResponse?.steps[0]?.content[0]?.type === 'text' ? 
          agentResponse?.steps[0]?.content[0]?.text : '';
      }
    }
  } catch(e) {
    throw new ApplicationFailure('');
  }
};

export async function parallelToolCalling(request: PromptRequest) {
  try {
    const { prompt } = request;

    // 💬 Messages
    const messages:ModelMessage[] = [
      {
        role: 'system',
        content: 'You are a friendly weather assistant!'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    // 🛠️ Tools
    const tools = {
      weather: {
        description: 'Get the weather in a location',
        inputSchema: z.toJSONSchema(WeatherSchema)
      }
    };

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

      const { finishReason, content: contents } = agentResponse?.steps[0];

      if(finishReason === 'tool-calls') {
        const toolCallPromises = contents.map((content) => {
          if(content?.type === 'tool-call') {
            const { toolName, input } = content;
            const activity = activityMap[toolName];
            return activity(input);
          }
        });

        const toolCallResults = await Promise.all(toolCallPromises);

        // Build contents
        const buildContents:ToolContent = [];
        for(let i = 0; i < toolCallPromises.length; i++) {
          const content = contents[i];
          if(content.type === 'tool-call') {
             const { toolName, toolCallId } = content;
             const toolCallResult = toolCallResults[i];
             buildContents.push({
                toolName,
                toolCallId,
                type: 'tool-result',
                output: {
                  type: typeof toolCallResult === 'object' ? 'json' : 'text',
                  value: toolCallResult
                }
              });
          }
        }

        messages.push({
          role: 'tool',
          content: buildContents
        });
      } else if(finishReason === 'stop') {
        return contents[0].type === 'text' ? contents[0].text : '';
      } else if(finishReason === 'error' || finishReason === 'unknown') {
        throw new ApplicationFailure('');
      }
    }
  } catch(e) {
    throw new ApplicationFailure('');
  }
}

export async function toolCallingStreaming(request: PromptRequest):Promise<string> {
  try {
    const { prompt } = request;

    await createConversation({
      id: workflowInfo().workflowId,
      title: `${workflowInfo().workflowType}-${workflowInfo().workflowId.substring(0, 4)}`
    });

    await createMessage({
      conversationId: workflowInfo().workflowId,
      sender: 'user',
      content: prompt,
      name: USER_NAME,
      avatar: "https://github.com/haydenbleasel.png"
    });

    // 💬 Messages
    const messages:ModelMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful ai agent.'
      },
      {
        role: 'user',
        content: prompt
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
    };

    while(true) {
      const agentResponse = await chainActivities({
        activities: [
          () => openaiStreamText.executeWithOptions({
            summary: 'OpenAI.GenerateText',
          }, [{
            model: 'gpt-4o-mini',
            messages,
            tools
          }]),
          () => openaiStreamText.executeWithOptions({
            summary: 'Anthropic.GenerateText'
          }, [{
            model: 'claude-3-7-sonnet-20250219',
            messages,
            tools
          }])
        ]
      });
      
      const {finishReason, responseMessages, toolCalls} = agentResponse;

      
      // Add LLM generated messages to the message history
      messages.push(...responseMessages);

      if(finishReason === 'tool-calls') {
        // Create a Message Place Holder
        const assistantMessage = await createMessage({
          conversationId: workflowInfo().workflowId,
          sender: 'assistant',
          content: '',
          name: TEMPORAL_BOT,
          avatar: "https://github.com/shadcn.png"
        });

        // Schedule Activities
        for(const tool of toolCalls) {
          const { type } = tool;

          if(type === 'tool-call') {
            const { toolName, toolCallId, input } = tool;
            const activity = activityMap[toolName];
            await upsertTool({
              id: toolCallId,
              conversationId: workflowInfo().workflowId,
              type: toolName,
              input: input,
              messageId: assistantMessage[0].id,
              state: "input-available"
            }, {
              id: toolCallId,
              conversationId: workflowInfo().workflowId,
              type: toolName,
              input: input,
              messageId: assistantMessage[0].id,
              state: "input-available"
            });

            const toolResult = await activity(input);

            await upsertTool({
              id: toolCallId,
              conversationId: workflowInfo().workflowId,
              type: toolName,
              input: input,
              output: toolResult,
              messageId: assistantMessage[0].id,
              state: "input-available"
            }, {
              output: toolResult,
              state: "output-available"
            });
            messages.push({
              role: 'tool',
              content: [{
                toolName,
                toolCallId,
                type: 'tool-result',
                output: {
                  type: typeof toolResult === 'object' ? 'json' : 'text',
                  value: toolResult
                }
              }]
            });
          }
        }
      } else if(finishReason === 'error' || finishReason === 'unknown') {
        throw new ApplicationFailure();
      } else if(finishReason === 'stop') {
        // Exit the loop when the model doesn't request to use any more tools

        return responseMessages[0]?.content[0]?.type === 'text' ? 
          responseMessages[0]?.content[0]?.type.text : '';
      }
    }
  } catch(e) {
    throw new ApplicationFailure('');
  }
};
