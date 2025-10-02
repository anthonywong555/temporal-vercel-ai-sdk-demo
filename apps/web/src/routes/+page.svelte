<script lang="ts">
  import {
    Tool,
    ToolHeader,
    ToolContent,
    ToolInput,
    ToolOutput,
  } from "$lib/components/ai-elements/tool";

  import { Message, MessageAvatar, MessageContent } from "$lib/components/ai-elements/message/index.js";
	
  const messages: MessageData[] = $state([
		{
			key: crypto.randomUUID(),
			from: "user",
			content: "Hello, how are you?",
			avatar: "https://github.com/haydenbleasel.png",
			name: "Hayden Bleasel",
		},
		{
			key: crypto.randomUUID(),
			from: "assistant",
			content: "Hello! I'm doing well, thank you for asking. How can I help you today?",
			avatar: "https://github.com/copilot.png",
			name: "Assistant",
		},
		{
			key: crypto.randomUUID(),
			from: "user",
			content: "Can you help me understand Svelte 5 runes?",
			avatar: "https://github.com/haydenbleasel.png",
			name: "Hayden Bleasel",
		},
		{
			key: crypto.randomUUID(),
			from: "assistant",
			content: "Absolutely! Svelte 5 introduces runes like $state, $derived, and $props which provide a more powerful and flexible reactivity system. Would you like me to explain any specific rune?",
			avatar: "https://github.com/copilot.png",
			name: "Assistant",
		},
	]);

  type MessageData = {
		key: string;
		from: "user" | "assistant";
		content: string;
		avatar: string;
		name: string;
	};


  // Mock tool data
  let toolData = {
    type: "web_search",
    state: "output-available" as const,
    input: {
      query: "latest AI developments 2024",
      count: 5,
      language: "en"
    },
    output: {
      results: [
        {
          title: "Revolutionary AI Breakthrough in 2024",
          url: "https://example.com/ai-breakthrough-2024",
          snippet: "Scientists have achieved a major milestone in artificial intelligence..."
        },
        {
          title: "The Future of Machine Learning",
          url: "https://example.com/ml-future",
          snippet: "New research shows promising developments in neural networks..."
        }
      ],
      total_results: 147
    }
  };

  let errorToolData = {
    type: "database_query",
    state: "output-error" as const,
    input: {
      query: "SELECT * FROM users WHERE invalid_column = 'test'",
      database: "production"
    },
    errorText: "SQL Error: Column 'invalid_column' doesn't exist in table 'users'"
  };

  let loadingToolData = {
    type: "api_call",
    state: "input-available" as const,
    input: {
      endpoint: "/api/v1/data",
      method: "GET",
      headers: {
        "Authorization": "Bearer token123",
        "Content-Type": "application/json"
      }
    }
  };
</script>

<div class="max-w-2xl mx-auto p-6 space-y-6">
  <h1 class="text-2xl font-bold">Tool Components Example</h1>

  <!-- Successful Tool Example -->
  <Tool>
    <ToolHeader
      type={toolData.type}
      state={toolData.state}
    />
    <ToolContent>
      <ToolInput input={toolData.input} />
      <ToolOutput output={toolData.output} />
    </ToolContent>
  </Tool>

  <!-- Error Tool Example -->
  <Tool>
    <ToolHeader
      type={errorToolData.type}
      state={errorToolData.state}
    />
    <ToolContent>
      <ToolInput input={errorToolData.input} />
      <ToolOutput
        output={undefined}
        errorText={errorToolData.errorText}
      />
    </ToolContent>
  </Tool>

  <!-- Loading Tool Example -->
  <Tool>
    <ToolHeader
      type={loadingToolData.type}
      state={loadingToolData.state}
    />
    <ToolContent>
      <ToolInput input={loadingToolData.input} />
    </ToolContent>
  </Tool>

  <!-- Pending Tool Example -->
  <Tool>
    <ToolHeader
      type="file_analyzer"
      state="input-streaming"
    />
    <ToolContent>
      <ToolInput
        input={{
          file_path: "/documents/report.pdf",
          analysis_type: "summarization"
        }}
      />
    </ToolContent>
  </Tool>
</div>

<div class="space-y-4">
	{#each messages as { content, key, from, avatar, name }}
		<Message {from} data-key={key}>
			<MessageContent>{content}</MessageContent>
			<MessageAvatar {name} src={avatar} />
		</Message>
	{/each}
</div>