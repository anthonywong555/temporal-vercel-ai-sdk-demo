<script lang="ts">
  import { goto } from '$app/navigation';
  import ChatWidget from "$lib/components/chat-widget.svelte";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import {
    PromptInput,
    PromptInputBody,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputToolbar,
	type PromptInputMessage,
  } from "$lib/components/ai-elements/prompt-input";
  import { createChat } from "./chat/data.remote";

  async function handleSubmit (message: PromptInputMessage) {
    const { text } = message;
    const id = crypto.randomUUID();

    if(text) {
      const workflowId = await createChat({
        id,
        prompt: text,
        workflowType: 'prompt'
      });

      await goto(`/chat/${workflowId}`);
    }
  }
</script>

<ScrollArea class="h-[79vh] w-[full] rounded-md border p-4">
  <!--<ChatWidget />-->
</ScrollArea>
<PromptInput onSubmit={handleSubmit}>
  <PromptInputBody>
    <PromptInputTextarea />
  </PromptInputBody>
  <PromptInputToolbar class="flex justify-end">
    <PromptInputSubmit />
  </PromptInputToolbar>
</PromptInput>