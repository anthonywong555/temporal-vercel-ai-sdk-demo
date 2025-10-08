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
  import { Response } from "$lib/components/ai-elements/response";
  import { Query } from 'zero-svelte';
	import { get_z } from '$lib/z.svelte';

  const { conversationId } = $props();
  console.log(conversationId);

  const z = get_z();
  const messagesDB = new Query(z.query.messages
    .where('conversationId', '=', conversationId)
    .orderBy('createdAt', 'asc')
  );

  $effect.pre(() => {
    messagesDB.updateQuery(z.query.messages
      .where('conversationId', '=', conversationId)
      .orderBy('createdAt', 'asc')
    );
  })

  const messages = $derived(messagesDB.current);

    // Mock tool data
  let toolData = {};
  let errorToolData = {};
  // Reactive state using Svelte 5 runes
  //let visibleMessages = $state<MessageData[]>([]);
</script>

<Conversation class="h-full">
  <ConversationContent>
    {#each messages as messageData, index (messageData.id)}
      <Message from={messageData.sender}>
        {#if messageData.content && messageData.sender === 'assistant'}
          <MessageContent>
            <Response content={messageData.content} />
          </MessageContent>
        {:else}
          <MessageContent>{messageData.content}</MessageContent>
        {/if}
        <MessageAvatar name={messageData.name} src={messageData.avatar} />
      </Message>
    {/each}
  </ConversationContent>
  <ConversationScrollButton />
</Conversation>