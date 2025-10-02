<script lang="ts">
	import NavSettings from "$lib/components/nav-settings.svelte";
	import SidebarLeft from "$lib/components/sidebar-left/sidebar-left.svelte";
	import ChatWidget from "$lib/components/chat-widget.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	 import {
    PromptInput,
    PromptInputBody,
    type PromptInputMessage,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputToolbar,
    type ChatStatus,
  } from "$lib/components/ai-elements/prompt-input";

</script>

<Sidebar.Provider>
	<SidebarLeft />
	<Sidebar.Inset>
		<header class="flex h-16 justify-between shrink-0 items-center gap-2 border-b">
			<div class="flex items-center gap-2 px-3">
				<div>
					<Sidebar.Trigger />
				</div>
			</div>
			<div class="flex items-center gap-2 px-3">
				<div>
					<h1>Temporal - Vercel AI SDK Demo</h1>
				</div>
			</div>
			<div class="flex items-center gap-2 px-3">
				<div>
					<NavSettings />
				</div>
			</div>
		</header>
		<ScrollArea class="h-[79vh] w-[full] rounded-md border p-4">
			<ChatWidget />
		</ScrollArea>
		<PromptInput onSubmit={() => {}}>
          <PromptInputBody>
            <PromptInputTextarea />
          </PromptInputBody>
          <PromptInputToolbar class="flex justify-end">
            <PromptInputSubmit />
          </PromptInputToolbar>
        </PromptInput>
	</Sidebar.Inset>
</Sidebar.Provider>
