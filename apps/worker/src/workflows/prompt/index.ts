import { ApplicationFailure, proxyActivities, workflowInfo } from '@temporalio/workflow';
import { ANTHROPIC_TASK_QUEUE, OPEN_AI_TASK_QUEUE, PromptRequest, TEMPORAL_BOT, USER_NAME } from '@temporal-vercel-demo/common';
import { createAIActivities } from "@temporal-vercel-demo/ai";
import { createDrizzleActivites } from "@temporal-vercel-demo/database";
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

const { createConversation, createMessage } = proxyActivities<ReturnType<typeof createDrizzleActivites>>({
  scheduleToCloseTimeout: '2 minute',
  retry: {
    maximumAttempts: 3
  }
});

export async function prompt(request: PromptRequest): Promise<string> {
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
    });

    const aiMessage = result?.steps[0]?.content[0]?.type === 'text' ? 
      result?.steps[0]?.content[0]?.text : 
      '';;

    await createMessage({
      conversationId: workflowInfo().workflowId,
      sender: 'assistant',
      content: aiMessage,
      avatar: "https://github.com/shadcn.png"
    });

    return aiMessage;    
  } catch(e) {
    throw new ApplicationFailure('');
  }
}