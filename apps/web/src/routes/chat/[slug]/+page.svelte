<script lang="ts">
  import type { PageProps } from './$types';
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
  const { data }: PageProps = $props();
  const { id: chatId } = data;
  console.log(chatId);
  async function handleSubmit(message: PromptInputMessage) {
    const { text } = message;
    console.log(text);
  }
</script>


<ScrollArea class="h-[79vh] w-[full] rounded-md border p-4">
  <ChatWidget />
</ScrollArea>
<PromptInput onSubmit={handleSubmit}>
  <PromptInputBody>
    <PromptInputTextarea />
  </PromptInputBody>
  <PromptInputToolbar class="flex justify-end">
    <PromptInputSubmit />
  </PromptInputToolbar>
</PromptInput>