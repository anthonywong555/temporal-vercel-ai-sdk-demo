import { ApplicationFailure, condition, proxyActivities, workflowInfo, defineUpdate, setHandler, sleep } from '@temporalio/workflow';
import { GENERAL_TASK_QUEUE, ANTHROPIC_TASK_QUEUE, 
    OPEN_AI_TASK_QUEUE, BuyPlaneTicketSchema, BookHotelSchema, RentCarSchema, 
    PromptRequest,
    USER_NAME, 
    TEMPORAL_BOT,
    LLMMessageUpdate,
    UndoBuyPlaneTicketSchema,
    UndoBookHotelSchema,
    UndoRentCarSchema,
    GetPokemonSchema
} from '@temporal-vercel-demo/common';
import { createAIActivities } from "@temporal-vercel-demo/ai";
import * as toolActivities from "@temporal-vercel-demo/activities";
import { streamText, type ToolContent } from "ai";
import { createDrizzleActivites } from "@temporal-vercel-demo/database";
import { z } from "zod/v4";
import { chainActivities } from "../utils";
 
const { executeTool, getMCPTools } = proxyActivities<typeof toolActivities>({
  startToCloseTimeout: '2 minute',
  taskQueue: GENERAL_TASK_QUEUE,
  retry: {
    maximumAttempts: 5
  }
});

const { aiStreamText: openaiStreamText, aiStreamTextMCP: openaiStreamTextMCP, aiStreamTextMCPHttp: openaiStreamTextMCPHttp } = proxyActivities<ReturnType<typeof createAIActivities>>({
  scheduleToCloseTimeout: '2 minute',
  taskQueue: OPEN_AI_TASK_QUEUE,
  retry: {
    maximumAttempts: 3
  }
});

const { aiStreamText: anthropicStreamText, aiStreamTextMCP: anthropicStreamTextMCP, aiStreamTextMCPHttp: anthropicStreamTextMCPHttp } = proxyActivities<ReturnType<typeof createAIActivities>>({
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

const sendUserMessage = defineUpdate<boolean, [LLMMessageUpdate]>('sendUserMessage');

export async function stdio(request: PromptRequest) {
  try {
    let { messageHistory = [
      {
        role: 'system',
        content: 'You are an expert in Pokemon.'
      }
    ] } = request;

    let hasNewMessage = messageHistory.findIndex((message) => message.role === 'user') > -1;
    setHandler(sendUserMessage, async (newMessage) => {
      const { role, content } = newMessage;
      messageHistory.push({
        role,
        content
      });

      await createMessage({
        conversationId: workflowInfo().workflowId,
        sender: 'user',
        content,
        name: USER_NAME,
        avatar: "https://github.com/haydenbleasel.png"
      });

      hasNewMessage = true;
      return true;
    });

    // TODO: This should be read from the .env, but good enough for now.
    const { 
      isCAN = false
    } = request;

    if(!isCAN) {
      await createConversation({
        id: workflowInfo().workflowId,
        title: `${workflowInfo().workflowType}-${workflowInfo().workflowId.substring(0, 4)}`
      });
    }

    do {
      await condition(() => hasNewMessage);

      // 🛠️ Tools
      const tools = {
        'get-pokemon': {
          description: 'Get Pokemon details by name',
          inputSchema: z.toJSONSchema(GetPokemonSchema)
        }
      };

      const agentResponse = await chainActivities({
        activities: [
          () => openaiStreamText.executeWithOptions({
            summary: 'OpenAI.GenerateText',
          }, [{
            model: 'gpt-4o-mini',
            messages: messageHistory,
            tools
          }]),
          () => anthropicStreamText.executeWithOptions({
            summary: 'Anthropic.GenerateText'
          }, [{
            model: 'claude-3-7-sonnet-20250219',
            messages: messageHistory,
            tools
          }])
        ]
      });

      // Add LLM generated messages to the message history
      //messageHistory.push(...agentResponse?.responseMessages);

      const { finishReason, toolCalls } = agentResponse;

      if(finishReason === 'tool-calls') {
        const toolCallPromises = toolCalls.map(async (tool: { toolCallId?: any; type?: any; toolName?: any; input?: any; }) => {
          if(tool?.type === 'tool-call') {
            /*
            const { toolName, toolCallId, input } = tool;

            const assistantMessage = await createMessage({
              conversationId: workflowInfo().workflowId,
              sender: 'assistant',
              content: '',
              name: TEMPORAL_BOT,
              avatar: "https://github.com/shadcn.png"
            });

            await upsertTool({
              id: toolCallId,
              conversationId: workflowInfo().workflowId,
              type: toolName,
              input: input,
              messageId: assistantMessage[0].id,
              state: "input-streaming"
            }, {
              id: toolCallId,
              conversationId: workflowInfo().workflowId,
              type: toolName,
              input: input,
              messageId: assistantMessage[0].id,
              state: "input-streaming"
            });

            return executeTool({
              tool: toolName,
              toolId: toolCallId,
              args: input,
            });
            */
          }
        });

        await sleep('5 secs');
        //const toolResults = await Promise.all(toolCallPromises);
        await chainActivities({
          activities: [
            () => openaiStreamTextMCP.executeWithOptions({
              summary: 'OpenAI.GenerateText',
            }, [{
              model: 'gpt-4o-mini',
              messages: messageHistory,
              tools
            }]),
            () => anthropicStreamTextMCP.executeWithOptions({
              summary: 'Anthropic.GenerateText'
            }, [{
              model: 'claude-3-7-sonnet-20250219',
              messages: messageHistory,
              tools
            }])
          ]
        });

        return; 
        // Build contents
        /*
        const buildContents:ToolContent = [];
        for(let i = 0; i < toolResults.length; i++) {
          const tool = toolCalls[i];
          if(tool.type === 'tool-call') {
             const { toolName, toolCallId } = tool;
             const toolCallResult = toolResults[i];
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
        

        messageHistory.push({
          role: 'tool',
          content: buildContents
        });
        */

      } else if(finishReason === 'stop') {
        hasNewMessage = false;

        // Remove because we want the user to keep sending messages to the chat.
        // const aiMessage = contents[0].type === 'text' ? contents[0].text : '';
        // return aiMessage;
      } else if(finishReason === 'error' || finishReason === 'unknown') {
        throw new ApplicationFailure('');
      }
    } while(true)
  } catch(e) {
    throw new ApplicationFailure('');
  }
}

export async function http(request: PromptRequest) {
  try {
    let { messageHistory = [
      {
        role: 'system',
        content: 'You are a helpful chatbot.'
      }
    ] } = request;

    let hasNewMessage = messageHistory.findIndex((message) => message.role === 'user') > -1;
    setHandler(sendUserMessage, async (newMessage) => {
      const { role, content } = newMessage;
      /*
      messageHistory.push({
        role,
        content
      });
      */

      await createMessage({
        conversationId: workflowInfo().workflowId,
        sender: 'user',
        content,
        name: USER_NAME,
        avatar: "https://github.com/haydenbleasel.png"
      });
      
      hasNewMessage = true;
      return true;
    });

    // TODO: This should be read from the .env, but good enough for now.
    const { 
      isCAN = false
    } = request;

    if(!isCAN) {
      await createConversation({
        id: workflowInfo().workflowId,
        title: `${workflowInfo().workflowType}-${workflowInfo().workflowId.substring(0, 4)}`
      });
    }

    do {
      await condition(() => hasNewMessage);

      // 🛠️ Tools
      const tools = await getMCPTools('http://localhost:1234/mcp');

      const agentResponse = await chainActivities({
        activities: [
          () => openaiStreamText.executeWithOptions({
            summary: 'OpenAI.StreamText',
          }, [{
            model: 'gpt-4o-mini',
            messages: messageHistory,
            tools,
            prompt: 'Look up information about user with the ID foo_123'
          }]),
          () => anthropicStreamText.executeWithOptions({
            summary: 'Anthropic.StreamText'
          }, [{
            model: 'claude-3-7-sonnet-20250219',
            messages: messageHistory,
            tools,
            prompt: 'Look up information about user with the ID foo_123'
          }])
        ]
      });

      // Add LLM generated messages to the message history
      //messageHistory.push(...agentResponse?.responseMessages);

      const { finishReason, toolCalls } = agentResponse;

      if(finishReason === 'tool-calls') {
        const toolCallPromises = toolCalls.map(async (tool: { toolCallId?: any; type?: any; toolName?: any; input?: any; }) => {
          if(tool?.type === 'tool-call') {
            /*
            const { toolName, toolCallId, input } = tool;

            const assistantMessage = await createMessage({
              conversationId: workflowInfo().workflowId,
              sender: 'assistant',
              content: '',
              name: TEMPORAL_BOT,
              avatar: "https://github.com/shadcn.png"
            });

            await upsertTool({
              id: toolCallId,
              conversationId: workflowInfo().workflowId,
              type: toolName,
              input: input,
              messageId: assistantMessage[0].id,
              state: "input-streaming"
            }, {
              id: toolCallId,
              conversationId: workflowInfo().workflowId,
              type: toolName,
              input: input,
              messageId: assistantMessage[0].id,
              state: "input-streaming"
            });

            return executeTool({
              tool: toolName,
              toolId: toolCallId,
              args: input,
            });
            */
          }
        });

        await sleep('5 secs');
        //const toolResults = await Promise.all(toolCallPromises);
        await chainActivities({
          activities: [
            () => openaiStreamTextMCPHttp.executeWithOptions({
              summary: 'OpenAI.StreamTextMCPHttp',
            }, [{
              model: 'gpt-4o-mini',
              messages: messageHistory,
              tools
            }]),
            () => anthropicStreamTextMCPHttp.executeWithOptions({
              summary: 'Anthropic.StreamTextMCPHttp'
            }, [{
              model: 'claude-3-7-sonnet-20250219',
              messages: messageHistory,
              tools
            }])
          ]
        });

        return; 
        // Build contents
        /*
        const buildContents:ToolContent = [];
        for(let i = 0; i < toolResults.length; i++) {
          const tool = toolCalls[i];
          if(tool.type === 'tool-call') {
             const { toolName, toolCallId } = tool;
             const toolCallResult = toolResults[i];
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

        messageHistory.push({
          role: 'tool',
          content: buildContents
        });
        */

      } else if(finishReason === 'stop') {
        hasNewMessage = false;

        // Remove because we want the user to keep sending messages to the chat.
        // const aiMessage = contents[0].type === 'text' ? contents[0].text : '';
        // return aiMessage;
      } else if(finishReason === 'error' || finishReason === 'unknown') {
        throw new ApplicationFailure('');
      }
    } while(true)
  } catch(e) {
    throw new ApplicationFailure('');
  }
}