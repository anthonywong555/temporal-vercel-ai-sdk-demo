<script lang="ts">
  import ChatWidget from "$lib/components/chat-widget.svelte";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import {
    PromptInput,
    PromptInputBody,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputToolbar,
	type ChatStatus,
	type PromptInputMessage,
  } from "$lib/components/ai-elements/prompt-input";
  import type { PageProps } from "./$types";
  import { update } from "../../services/durable-execution/data.remote";

  let { data }:PageProps = $props();
  let status = $state<ChatStatus>("idle");
  let input_prompt = $state("");
  const conversationId = $derived(data.id);

  async function handleSubmit(message: PromptInputMessage) {
    console.log(conversationId);
    const { text } = message;
    if(text) {
      await update({
        id: conversationId,
        updateDef: 'sendUserMessage',
        updateArgs: {
          role: 'user',
          content: text
        }
      });
      input_prompt = "";
    }
  }
</script>


<div class="h-[79vh] w-[full] rounded-md border p-4">
  <ChatWidget conversationId={conversationId} />
</div>
<PromptInput onSubmit={handleSubmit}>
  <PromptInputBody>
    <PromptInputTextarea bind:value={input_prompt} />
  </PromptInputBody>
  <PromptInputToolbar class="flex justify-end">
    <PromptInputSubmit {status} />
  </PromptInputToolbar>
</PromptInput>