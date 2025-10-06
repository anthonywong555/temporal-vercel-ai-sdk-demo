<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from "mode-watcher";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
  import NavSettings from "$lib/components/nav-settings.svelte";
  import SidebarLeft from "$lib/components/sidebar-left/sidebar-left.svelte";
  import ChatWidget from "$lib/components/chat-widget.svelte";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import {
    PromptInput,
    PromptInputBody,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputToolbar,
	type PromptInputMessage,
  } from "$lib/components/ai-elements/prompt-input";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<Toaster />

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
		{@render children?.()}
  </Sidebar.Inset>
</Sidebar.Provider>