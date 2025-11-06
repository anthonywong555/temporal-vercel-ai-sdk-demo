<script lang="ts">
  import { goto } from '$app/navigation';
  import WorkflowChat from '$lib/components/workflow-chat.svelte';
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import {
    PromptInput,
    PromptInputBody,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputToolbar,
	type PromptInputMessage,
  } from "$lib/components/ai-elements/prompt-input";
  import { createChat, updateWithStart } from "./services/durable-execution/data.remote";
	import { getLocationInfo } from './services/util/data.remote';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  async function startChat({workflowType, prompt}: {workflowType: string, prompt: string}) {
    const id = crypto.randomUUID();

    
    if(workflowType === 'saga') {
      const location = await getLocationInfo();
      await updateWithStart({
        id,
        workflowArgs: {},
        workflowType,
        updateDef: 'sendUserMessage',
        updateArgs: {
          role: 'user',
          content: `${prompt}. I'm flying out from ${location}.`
        }
      });
    } else if(workflowType === 'stdio' || workflowType === 'http') {
      await updateWithStart({
        id,
        workflowArgs: {},
        workflowType,
        updateDef: 'sendUserMessage',
        updateArgs: {
          role: 'user',
          content: prompt
        }
      });
    } else {
      const workflowId = await createChat({
        id,
        prompt,
        workflowType
      });
    }

    await goto(`/chat/${id}`);
  }

  async function handleSubmit (message: PromptInputMessage) {
    const { text } = message;
    const id = crypto.randomUUID();

    if(text) {
      const workflowId = await createChat({
        id,
        prompt: text,
        workflowType: 'toolCallingStreaming'
      });

      await goto(`/chat/${workflowId}`);
    }
  }
</script>

<ScrollArea class="h-[79vh] w-[full] rounded-md border p-4">
  <WorkflowChat workflows={data.workflows} {startChat}/>
</ScrollArea>
<PromptInput onSubmit={handleSubmit}>
  <PromptInputBody>
    <PromptInputTextarea placeholder="📖 Choose Your Own Adventure ⚔️" />
  </PromptInputBody>
  <PromptInputToolbar class="flex justify-end">
    <PromptInputSubmit />
  </PromptInputToolbar>
</PromptInput>