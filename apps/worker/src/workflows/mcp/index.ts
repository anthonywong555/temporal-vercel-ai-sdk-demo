import { ApplicationFailure, condition, proxyActivities, workflowInfo, defineUpdate, setHandler, sleep, log, continueAsNew, isCancellation, CancellationScope } from '@temporalio/workflow';
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
import * as activities from "@temporal-vercel-demo/activities";
import { createDrizzleActivites } from "@temporal-vercel-demo/database";
import { chainActivities } from "../utils";
import type { AssistantContent, AssistantModelMessage, ToolApprovalResponse, ToolModelMessage, ToolResultPart  } from 'ai';
 
export type ResponseMessage = AssistantModelMessage | ToolModelMessage;
export type ToolContent = Array<ToolResultPart | ToolApprovalResponse>;

const { aiStreamTextMCPHttp: openaiStreamTextMCPHttp } = proxyActivities<ReturnType<typeof createAIActivities>>({
  scheduleToCloseTimeout: '2 minute',
  taskQueue: OPEN_AI_TASK_QUEUE,
  retry: {
    maximumAttempts: 3
  }
});

const { aiStreamTextMCPHttp: anthropicStreamTextMCPHttp } = proxyActivities<ReturnType<typeof createAIActivities>>({
  scheduleToCloseTimeout: '2 minute',
  taskQueue: ANTHROPIC_TASK_QUEUE,
  retry: {
    maximumAttempts: 3
  }
});

const { createConversation, createMessage, upsertTool, updateConversation, createTool, updateTool } = proxyActivities<ReturnType<typeof createDrizzleActivites>>({
  scheduleToCloseTimeout: '2 minute',
  retry: {
    maximumAttempts: 3
  }
});

const sendUserMessage = defineUpdate<boolean, [LLMMessageUpdate]>('sendUserMessage')

// These workflows follow the pattern of having the message history in the db.

export async function stdio(request: PromptRequest) {
  try {
    let { messageHistory = [
      {
        role: 'system',
        content: 'You are an expert in Pokemon'
      }
    ] } = request;
    let pendingUserMessages:LLMMessageUpdate[] = [];
    let llmLoop = false;

    setHandler(sendUserMessage, async(newMessage) => {
      try {
        const { content } = newMessage;

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
      } catch(e) { 
        if(e instanceof Error) {
          log.error(`Failed to save user message. Error Message: ${e}`);
        }
        return false;
      }
    });

    do {
      await condition(() => (pendingUserMessages.length > 0 || llmLoop));

      if(pendingUserMessages.length > 0) {
        // Save the message in the DB.
        // Add it into the message history.
        messageHistory = [...messageHistory, ...pendingUserMessages];
        pendingUserMessages = [];
      }

      if(llmLoop) {
        llmLoop = false;
      }

      const agentResponse = await chainActivities({
        activities: [
          () => openaiStreamTextMCPHttp.executeWithOptions({
            summary: 'OpenAI.StreamText',
          }, [{
            model: 'gpt-4o',
            messages: messageHistory
          }]),
          () => anthropicStreamTextMCPHttp.executeWithOptions({
            summary: 'Anthropic.StreamText'
          }, [{
            model: 'claude-3-7-sonnet-20250219',
            messages: messageHistory
          }])
        ]
      });

      const { finishReason, toolCalls } = agentResponse;
      const responseMessages:ResponseMessage[] = agentResponse.responseMessages;

      messageHistory.push(...responseMessages);

      for(const responseMessage of responseMessages) {
        const { role } = responseMessage;
        if(role === 'assistant') {
          const contents = responseMessage.content;
          if(contents instanceof Array) {
            const shouldCreateMessage = contents.find((content) => content.type === 'tool-call');

            if(shouldCreateMessage) {
              // First we create a message so our tools can attach to it. 
              const assistantMessage = await createMessage({
                conversationId: workflowInfo().workflowId,
                sender: 'assistant',
                content: '',
                name: TEMPORAL_BOT,
                avatar: "https://github.com/shadcn.png"
              });

              for(const content of contents) {
                if(content.type === 'tool-call') {
                  const { toolCallId, toolName, input } = content;
                  createTool({
                    id: toolCallId,
                    conversationId: workflowInfo().workflowId,
                    type: toolName,
                    //@ts-ignore
                    input: input,
                    messageId: assistantMessage[0].id,
                    state: 'input-streaming'
                  })
                }
              }
            }
          }
        }
      }

      for(const responseMessage of responseMessages) {
        if(responseMessage.role === 'tool') {
          const contents:ToolContent = responseMessage.content;
          for(const content of contents) {
            if(content.type === 'tool-result') {
              const { toolCallId, output } = content;
              await updateTool({
                state: 'output-available',
                //@ts-ignore
                output: output.value
              }, toolCallId);
            }
          }
        }
      }

      if(finishReason === 'tool-calls') {
        llmLoop = true;
      } else if(finishReason === 'stop') {
        llmLoop = false;
      } else if(finishReason === 'error' || finishReason === 'unknown') {
        throw new ApplicationFailure('');
      }
    } while(!workflowInfo().continueAsNewSuggested)
    await continueAsNew<typeof http>(request);
  } catch(e) {
    if(isCancellation(e)) {
      log.info(`Workflow is getting cancelled.`);
      await CancellationScope.nonCancellable(() => 
        updateConversation({
          state: 'closed'
        }, workflowInfo().workflowId)
      );
      return;
    }
    if(e instanceof Error) {
      log.error(`Workflow Error. Error Message: ${e.message}`);
      throw new ApplicationFailure(e.message);
    }
    throw new ApplicationFailure();
  }
}

export async function http(request: PromptRequest) {
  try {
    let { messageHistory = [
      {
        role: 'system',
        content: 'You are a helpful chatbot'
      }
    ] } = request;
    let pendingUserMessages:LLMMessageUpdate[] = [];
    let llmLoop = false;

    setHandler(sendUserMessage, async(newMessage) => {
      try {
        const { content } = newMessage;

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
      } catch(e) { 
        if(e instanceof Error) {
          log.error(`Failed to save user message. Error Message: ${e}`);
        }
        return false;
      }
    });

    do {
      await condition(() => (pendingUserMessages.length > 0 || llmLoop));

      if(pendingUserMessages.length > 0) {
        // Save the message in the DB.
        // Add it into the message history.
        messageHistory = [...messageHistory, ...pendingUserMessages];
        pendingUserMessages = [];
      }

      if(llmLoop) {
        llmLoop = false;
      }

      const agentResponse = await chainActivities({
        activities: [
          () => openaiStreamTextMCPHttp.executeWithOptions({
            summary: 'OpenAI.StreamText',
          }, [{
            model: 'gpt-4o',
            messages: messageHistory
          }]),
          () => anthropicStreamTextMCPHttp.executeWithOptions({
            summary: 'Anthropic.StreamText'
          }, [{
            model: 'claude-3-7-sonnet-20250219',
            messages: messageHistory
          }])
        ]
      });

      const { finishReason, toolCalls } = agentResponse;
      const responseMessages:ResponseMessage[] = agentResponse.responseMessages;

      messageHistory.push(...responseMessages);

      for(const responseMessage of responseMessages) {
        const { role } = responseMessage;
        if(role === 'assistant') {
          const contents = responseMessage.content;
          if(contents instanceof Array) {
            const shouldCreateMessage = contents.find((content) => content.type === 'tool-call');

            if(shouldCreateMessage) {
              // First we create a message so our tools can attach to it. 
              const assistantMessage = await createMessage({
                conversationId: workflowInfo().workflowId,
                sender: 'assistant',
                content: '',
                name: TEMPORAL_BOT,
                avatar: "https://github.com/shadcn.png"
              });

              for(const content of contents) {
                if(content.type === 'tool-call') {
                  const { toolCallId, toolName, input } = content;
                  createTool({
                    id: toolCallId,
                    conversationId: workflowInfo().workflowId,
                    type: toolName,
                    //@ts-ignore
                    input: input,
                    messageId: assistantMessage[0].id,
                    state: 'input-streaming'
                  })
                }
              }
            }
          }
        }
      }

      // Adding sleep because it's possible the postgres db hasn't fully commit the information.
      await sleep('1 sec');

      for(const responseMessage of responseMessages) {
        if(responseMessage.role === 'tool') {
          const contents:ToolContent = responseMessage.content;
          for(const content of contents) {
            if(content.type === 'tool-result') {
              const { toolCallId, output } = content;
              await updateTool({
                //@ts-ignore
                state: output.value.isError ? 'output-error': 'output-available',
                //@ts-ignore
                output: output.value
              }, toolCallId);
            }
          }
        }
      }

      if(finishReason === 'tool-calls') {
        llmLoop = true;
      } else if(finishReason === 'stop') {
        llmLoop = false;
      } else if(finishReason === 'error' || finishReason === 'unknown') {
        throw new ApplicationFailure('');
      }
    } while(!workflowInfo().continueAsNewSuggested)
    await continueAsNew<typeof http>(request);
  } catch(e) {
    if(isCancellation(e)) {
      log.info(`Workflow is getting cancelled.`);
      await CancellationScope.nonCancellable(() => 
        updateConversation({
          state: 'closed'
        }, workflowInfo().workflowId)
      );
      return;
    }
    if(e instanceof Error) {
      log.error(`Workflow Error. Error Message: ${e.message}`);
      throw new ApplicationFailure(e.message);
    }
    throw new ApplicationFailure();
  }
}