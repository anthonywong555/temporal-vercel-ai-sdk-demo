import { ApplicationFailure, proxyActivities, sleep, workflowInfo } from '@temporalio/workflow';
import { GENERAL_TASK_QUEUE, ANTHROPIC_TASK_QUEUE, 
    OPEN_AI_TASK_QUEUE, BuyPlaneTicketSchema, BookHotelSchema, RentCarSchema, 
    PromptRequest,
    USER_NAME, 
    TEMPORAL_BOT} from '@temporal-vercel-demo/common';
import { createAIActivities } from "@temporal-vercel-demo/ai";
import * as toolActivities from "@temporal-vercel-demo/tools";
import { type ModelMessage, type ToolContent } from "ai";
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

export async function saga(request: PromptRequest) {
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
        content: "You are a friendly trip advisor assistant! \n\
          Assume the city the person is booking is within USA. \n\
          Example 1:\n\
          - User: I want to book a trip to Paris. \n\
          - LLM: Sure thing, I'm booking a trip to Paris, Texas. \n\
          Example 2:\n\
          - User: I want to book a trip to Florence. \n\
          - LLM: Sure thing, I'm booking a trip to Florance, Italy. \n\
          Book the user an airplane ticket, hotel, and car rental. \n\
          You have to book it one at a time.\n\
          If user interrupts you, then do the following: \n\
          1. Undo all booking that has taken place. \n\
          2. Make sure they really know where at they going to before rebooking. \n\
          \n\
          You can assume the person is departing from NYC if they don't specify."
      },
      {
        role: 'user',
        content: prompt
      }
    ];

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
      }
    };

    while(true) {
      const agentResponse = await chainActivities({
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
      messages.push(...agentResponse?.responseMessages);

      const { finishReason } = agentResponse;
      const contents = agentResponse?.responseMessages[0].content;

      if(finishReason === 'tool-calls') {

        if(contents[0]?.type === 'text') {
          await createMessage({
            conversationId: workflowInfo().workflowId,
            sender: 'assistant',
            content: contents[0]?.text,
            name: TEMPORAL_BOT,
            avatar: "https://github.com/shadcn.png"
          });
        }


        const toolCallPromises = contents.map(async (content: { toolCallId?: any; type?: any; toolName?: any; input?: any; }) => {
          if(content?.type === 'tool-call') {
            const assistantMessage = await createMessage({
              conversationId: workflowInfo().workflowId,
              sender: 'assistant',
              content: '',
              name: TEMPORAL_BOT,
              avatar: "https://github.com/shadcn.png"
            });
            const { toolName, toolCallId, input } = content;

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
        const aiMessage = contents[0].type === 'text' ? contents[0].text : '';
        await createMessage({
          conversationId: workflowInfo().workflowId,
          sender: 'assistant',
          content: aiMessage,
          avatar: "https://github.com/shadcn.png"
        });
        return aiMessage;
      } else if(finishReason === 'error' || finishReason === 'unknown') {
        throw new ApplicationFailure('');
      }
    }
  } catch(e) {
    throw new ApplicationFailure('');
  }
}