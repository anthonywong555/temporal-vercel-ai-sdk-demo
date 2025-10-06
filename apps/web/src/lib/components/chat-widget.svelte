<script lang="ts">
  	 import {
    ChainOfThought,
    ChainOfThoughtContent,
    ChainOfThoughtHeader,
    ChainOfThoughtImage,
    ChainOfThoughtSearchResult,
    ChainOfThoughtSearchResults,
    ChainOfThoughtStep,
  } from "$lib/components/ai-elements/chain-of-thought/index";

  import {
    Conversation,
    ConversationContent,
    ConversationEmptyState,
    ConversationScrollButton,
  } from "$lib/components/ai-elements/conversation/index";

  import {
    Tool,
    ToolHeader,
    ToolContent,
    ToolInput,
    ToolOutput,
  } from "$lib/components/ai-elements/tool";

  import {
    Message,
    MessageAvatar,
    MessageContent,
  } from "$lib/components/ai-elements/message/index.js";
  import { MessageSquare, SearchIcon } from "@lucide/svelte";
  interface MessageData {
    key: string;
    value: string;
    name: string;
    avatar: string;
  }

  const messages: MessageData[] = [];

    // Mock tool data
  let toolData = {};
  let errorToolData = {};
  // Reactive state using Svelte 5 runes
  let visibleMessages = $state<MessageData[]>([]);

</script>

<Conversation class="h-full">
  <ConversationContent>
    {#if visibleMessages.length === 0}
      <ConversationEmptyState
        description="Messages will appear here as the conversation progresses."
        title="Start a conversation"
      >
        {#snippet icon()}
          <MessageSquare class="size-6" />
        {/snippet}
      </ConversationEmptyState>
    {:else}
      {#each visibleMessages as messageData, index (messageData.key)}
        <Message from={index % 2 === 0 ? "user" : "assistant"}>
          <MessageContent>{messageData.value}</MessageContent>
          <MessageAvatar name={messageData.name} src={messageData.avatar} />
        </Message>
      {/each}
    {/if}
  </ConversationContent>
  <ConversationScrollButton />
</Conversation>