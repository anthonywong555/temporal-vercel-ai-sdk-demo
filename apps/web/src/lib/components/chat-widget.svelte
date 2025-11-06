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
  import { Response } from "$lib/components/ai-elements/response";
  import { Query } from 'zero-svelte';
	import { get_z } from '$lib/z.svelte';

  const { conversationId } = $props();
  console.log(conversationId);

  const z = get_z();
  let messagesDB = new Query(z.query.MessageSchema
    .where('conversationId', '=', conversationId)
    .orderBy('createdAt', 'asc')
  );

  let toolsDB = new Query(z.query.ToolSchema
    .where('conversationId', '=', conversationId)
    .orderBy('createdAt', 'asc')
  )

  $effect.pre(() => {
    messagesDB.updateQuery(z.query.MessageSchema
        .where('conversationId', '=', conversationId)
        .orderBy('createdAt', 'asc')
    );

    toolsDB.updateQuery(z.query.ToolSchema
      .where('conversationId', '=', conversationId)
      .orderBy('createdAt', 'asc')
    )
  })

  const messages = $derived(messagesDB.current);
  const tools = $derived(toolsDB.current);
</script>

<Conversation class="h-full max-w-full">
  <ConversationContent>
    {#each messages as messageData, index (messageData.id)}
        {#if messageData.sender === 'assistant'}
          {#if messageData.content && messageData.content.length > 0}
          <Message from={messageData.sender}>
            <MessageContent>
              <Response content={messageData.content} />
            </MessageContent>
            <MessageAvatar name={messageData.name} src={messageData.avatar} />
          </Message>
          {:else}
          {#each tools as toolData, index (toolData.id)}
            {#if toolData.messageId === messageData.id}
                <Tool>
                  <ToolHeader
                    type={toolData.type}
                    state={toolData.state}
                  />
                  <ToolContent>
                      <ToolInput input={JSON.parse(toolData.input)} />
                      <ToolOutput output={JSON.parse(toolData.output)} errorText={toolData.errorText} />
                  </ToolContent>
                </Tool>
            {/if}
          {/each}
          {/if}
        {:else}
          <Message from={messageData.sender}>
            <MessageContent>
              {messageData.content}
            </MessageContent>
            <MessageAvatar name={messageData.name} src={messageData.avatar} />
          </Message>
        {/if}
    {/each}
  </ConversationContent>
  <ConversationScrollButton />
</Conversation>