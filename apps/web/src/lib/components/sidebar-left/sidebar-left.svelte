<script lang="ts">
	import NavPageFunctions from "./nav-page-functions.svelte";
	import NavChats from './nav-chats.svelte';
	import NavHeader from "./nav-header.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root class="border-r-0" {...restProps}>
	<Sidebar.Header>
		<NavHeader />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavChats />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavPageFunctions />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
