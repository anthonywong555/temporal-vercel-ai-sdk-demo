import { ApplicationFailure, condition, proxyActivities, workflowInfo, defineUpdate, setHandler, sleep } from '@temporalio/workflow';
import { GENERAL_TASK_QUEUE, ANTHROPIC_TASK_QUEUE, 
    OPEN_AI_TASK_QUEUE, BuyPlaneTicketSchema, BookHotelSchema, RentCarSchema, 
    PromptRequest,
    USER_NAME, 
    TEMPORAL_BOT,
    LLMMessageUpdate,
    UndoBuyPlaneTicketSchema,
    UndoBookHotelSchema,
    UndoRentCarSchema
} from '@temporal-vercel-demo/common';
import { createAIActivities } from "@temporal-vercel-demo/ai";
import * as toolActivities from "@temporal-vercel-demo/tools";
import { type ToolContent } from "ai";
import { createDrizzleActivites } from "@temporal-vercel-demo/database";
import { z } from "zod/v4";
import { chainActivities } from "../utils";

const { executeTool } = proxyActivities<typeof toolActivities>({
  startToCloseTimeout: '2 minute',
  taskQueue: GENERAL_TASK_QUEUE,
  retry: {
    maximumAttempts: 5
  }
});

const { aiStreamText: openaiStreamText } = proxyActivities<ReturnType<typeof createAIActivities>>({
  scheduleToCloseTimeout: '2 minute',
  taskQueue: OPEN_AI_TASK_QUEUE,
  retry: {
    maximumAttempts: 3
  }
});

const { aiStreamText: anthropicStreamText } = proxyActivities<ReturnType<typeof createAIActivities>>({
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

export async function saga(request: PromptRequest) {
  try {
    let { messageHistory = [
      {
        role: 'system',
        content: "You are a friendly trip advisor assistant! \n\
          Assume the city the person is booking is within USA. \n\
          Example 1:\n\
          - User: I want to book a trip to Paris. \n\
          - LLM: Sure thing, I'm booking a trip to Paris, Texas. \n\
          Example 2:\n\
          - User: I want to book a trip to Florence. \n\
          - LLM: Sure thing, I'm booking a trip to Florance, South Carolina. \n\
          Book the user an airplane ticket, hotel, and car rental. \n\
          You have to book it one at a time.\n\
          If user interrupts you for a correction then do the following: \n\
          1. Only undo all booking that has taken place. \n\
          2. Reconfirm the user really know where at they going to before rebooking. Like triple check! Only do this after you have undo all the bookings. \n\
          \n\
          You can assume the person is departing from NYC if they don't specify."
      }
    ] } = request;

    let hasNewMessage = false;
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
        buyPlaneTicket: {
          description: 'Book the Airplane Ticket.',
          inputSchema: z.toJSONSchema(BuyPlaneTicketSchema)
        },
        bookHotel: {
          description: 'Reserve a hotel at a given city.',
          inputSchema: z.toJSONSchema(BookHotelSchema)
        },
        rentCar: {
          description: 'Reserve a car for a given city.',
          inputSchema: z.toJSONSchema(RentCarSchema)
        },
        undoBuyPlaneTicket: {
          description: 'Undo the booking the Airplane Ticket.',
          inputSchema: z.toJSONSchema(UndoBuyPlaneTicketSchema)
        },
        undoBookHotel: {
          description: 'Undo reserve a hotel at a given city.',
          inputSchema: z.toJSONSchema(UndoBookHotelSchema)
        },
        undoRentCar: {
          description: 'Undo reserve a car for a given city.',
          inputSchema: z.toJSONSchema(UndoRentCarSchema)
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
      messageHistory.push(...agentResponse?.responseMessages);

      const { finishReason, toolCalls } = agentResponse;

      if(finishReason === 'tool-calls') {
        const toolCallPromises = toolCalls.map(async (tool: { toolCallId?: any; type?: any; toolName?: any; input?: any; }) => {
          if(tool?.type === 'tool-call') {
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
          }
        });

        await sleep('5 secs');
        const toolResults = await Promise.all(toolCallPromises);

        // Build contents
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