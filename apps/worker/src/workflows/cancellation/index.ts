import { ApplicationFailure, condition, proxyActivities, workflowInfo, defineUpdate, setHandler, sleep, log, continueAsNew, isCancellation, CancellationScope, ActivityCancellationType } from '@temporalio/workflow';
import { 
    GENERAL_TASK_QUEUE, 
    ANTHROPIC_TASK_QUEUE, 
    OPEN_AI_TASK_QUEUE,
    PromptRequest,
    USER_NAME, 
    TEMPORAL_BOT,
    LLMMessageUpdate
} from '@temporal-vercel-demo/common';
import { createAIActivities } from "@temporal-vercel-demo/ai";
import * as toolActivities from "@temporal-vercel-demo/activities";
import { createDrizzleActivites } from "@temporal-vercel-demo/database";
import { chainActivities, ResponseMessage, ToolContent } from "../utils";

const { executeTool } = proxyActivities<typeof toolActivities>({
  startToCloseTimeout: '2 minute',
  taskQueue: GENERAL_TASK_QUEUE,
  retry: {
    maximumAttempts: 5
  }
});

const { aiStreamTextCancellable: openaiStreamTextCancellable } = proxyActivities<ReturnType<typeof createAIActivities>>({
  startToCloseTimeout: '60s',
  heartbeatTimeout: '10s',
  taskQueue: OPEN_AI_TASK_QUEUE,
  cancellationType: ActivityCancellationType.WAIT_CANCELLATION_COMPLETED,
  retry: {
    maximumAttempts: 3
  }
});

const { aiStreamTextCancellable: anthropicStreamTextCancellable } = proxyActivities<ReturnType<typeof createAIActivities>>({
  startToCloseTimeout: '60s',
  heartbeatTimeout: '10s',
  taskQueue: ANTHROPIC_TASK_QUEUE,
  cancellationType: ActivityCancellationType.WAIT_CANCELLATION_COMPLETED,
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

const sendUserMessage = defineUpdate<boolean, [LLMMessageUpdate]>('sendUserMessage');

export async function cancellation(request: PromptRequest) {
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

      await sleep('10 sec');
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
          () => openaiStreamTextCancellable.executeWithOptions({
            summary: 'OpenAI.StreamTextCancellable',
          }, [{
            model: 'gpt-4o',
            messages: messageHistory
          }]),
          () => anthropicStreamTextCancellable.executeWithOptions({
            summary: 'Anthropic.StreamTextCancellable'
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
    await continueAsNew<typeof cancellation>(request);
  } catch(e) {
    if(isCancellation(e)) {
      log.error(`Workflow is getting cancelled.`);
      await CancellationScope.nonCancellable(() => 
        updateConversation({
          state: 'closed'
        }, workflowInfo().workflowId)
      );
      throw e;
    }
    if(e instanceof Error) {
      log.error(`Workflow Error. Error Message: ${e.message}`);
      throw new ApplicationFailure(e.message);
    }
    throw new ApplicationFailure();
  }
}