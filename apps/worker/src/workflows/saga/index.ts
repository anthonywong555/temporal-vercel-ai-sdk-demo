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
} from '@temporal-vercel-demo/common';
import { createAIActivities } from "@temporal-vercel-demo/ai";
import * as toolActivities from "@temporal-vercel-demo/activities";
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

const { createMessage, upsertTool } = proxyActivities<ReturnType<typeof createDrizzleActivites>>({
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
          1. Only undo all booking that has taken place. Triple check this otherwise, I'm unplugging you. :D. Also it's possible that nothing has been book. If that's the case, then simply start a new booking processing. \n\
          2. Reconfirm the user really know where at they going to before rebooking. Like triple check! Only do this after you have undo all the bookings. \n\
          \n\
          "
      }
    ] } = request;

    // Chat Control Loop
    let llmLoop = false;

    // Store all user message in an array.
    let pendingUserMessages:LLMMessageUpdate[] = [];


    setHandler(sendUserMessage, async (newMessage) => {
      const { content } = newMessage;

      // Ideally this should be a bulk create.
      await createMessage({
        conversationId: workflowInfo().workflowId,
        sender: 'user',
        content,
        name: USER_NAME,
        avatar: "https://github.com/haydenbleasel.png"
      });

      // Collect the user message.
      // This comes in handy on when the LLM should see the user message. 
      // Ideally the latest message not inbetween tool calling.
      pendingUserMessages.push(newMessage);

      return true;
    });

    do {
      await condition(() => (pendingUserMessages.length > 0) || llmLoop);
      
      if(pendingUserMessages.length > 0) {
        // Save the message in the DB.
        // Add it into the message history.
        messageHistory = [...messageHistory, ...pendingUserMessages];
        pendingUserMessages = [];
      }

      if(llmLoop) {
        llmLoop = false;
      }
      
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
            summary: 'OpenAI.StreamText',
          }, [{
            model: 'gpt-4o',
            messages: messageHistory,
            tools
          }]),
          () => anthropicStreamText.executeWithOptions({
            summary: 'Anthropic.StreamText'
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
        const assistantMessages:any[] = [];
        const plannedToolCalls:any[] = [];

        for(const toolCall of toolCalls) {
          const { type } = toolCall;

          if(type === 'tool-call') {
            // First we create a message so our tools can attach to it. 
            const assistantMessage = await createMessage({
              conversationId: workflowInfo().workflowId,
              sender: 'assistant',
              content: '',
              name: TEMPORAL_BOT,
              avatar: "https://github.com/shadcn.png"
            });

            // We add it into array just in case we need to update the tool if it gets cancelled.
            assistantMessages.push(assistantMessage);

            const { toolName, toolCallId, input } = toolCall;

            // Attach the tool message to the message.
            // Set the status to be pending.
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

            // Add it to an array of toolCallPromises
            plannedToolCalls.push(() => executeTool({
              tool: toolName,
              toolId: toolCallId,
              args: input,
            }));
          }
        }

        llmLoop = true;

        const toolCallPromises = plannedToolCalls.map(start => start());
        // TODO: Use Promise.allSeattle :D 
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
        llmLoop = false;
      } else if(finishReason === 'error' || finishReason === 'unknown') {
        throw new ApplicationFailure('');
      }
    } while(true)
  } catch(e: unknown) {
    if(e instanceof Error) {
      throw new ApplicationFailure(e.message);
    }
    throw new ApplicationFailure();
  }
}