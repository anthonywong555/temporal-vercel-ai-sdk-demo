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
import * as toolActivities from "@temporal-vercel-demo/activities";
import { createDrizzleActivites } from "@temporal-vercel-demo/database";
import { chainActivities } from "../utils";
 
const { executeTool, getMCPTools } = proxyActivities<typeof toolActivities>({
  startToCloseTimeout: '2 minute',
  taskQueue: GENERAL_TASK_QUEUE,
  retry: {
    maximumAttempts: 5
  }
});

const { aiStreamTextMCPStdio: openaiStreamTextMCPStdio, aiStreamTextMCPHttp: openaiStreamTextMCPHttp } = proxyActivities<ReturnType<typeof createAIActivities>>({
  scheduleToCloseTimeout: '2 minute',
  taskQueue: OPEN_AI_TASK_QUEUE,
  retry: {
    maximumAttempts: 3
  }
});

const { aiStreamTextMCPStdio: anthropicStreamTextMCPStdio, aiStreamTextMCPHttp: anthropicStreamTextMCPHttp } = proxyActivities<ReturnType<typeof createAIActivities>>({
  scheduleToCloseTimeout: '2 minute',
  taskQueue: ANTHROPIC_TASK_QUEUE,
  retry: {
    maximumAttempts: 3
  }
});

const { createConversation, createMessage, upsertTool, updateConversation } = proxyActivities<ReturnType<typeof createDrizzleActivites>>({
  scheduleToCloseTimeout: '2 minute',
  retry: {
    maximumAttempts: 3
  }
});

const sendUserMessage = defineUpdate<boolean, [LLMMessageUpdate]>('sendUserMessage')

// These workflows follow the pattern of having the message history in the db.

export async function stdio(request: PromptRequest) {
  try {
    let pendingUserMessages:LLMMessageUpdate[] = [];
    let llmLoop = false;

    setHandler(sendUserMessage, async(newMessage) => {
      try {
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

    } while(!workflowInfo().continueAsNewSuggested)
    
    await continueAsNew<typeof stdio>(request);
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
    let pendingUserMessages:LLMMessageUpdate[] = [];
    let llmLoop = false;

    setHandler(sendUserMessage, async(newMessage) => {
      try {
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

    } while(!workflowInfo().continueAsNewSuggested)
    
    await continueAsNew<typeof stdio>(request);
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