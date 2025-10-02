<script lang="ts">
	import NavSettings from "$lib/components/nav-settings.svelte";
	import SidebarLeft from "$lib/components/sidebar-left/sidebar-left.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
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
		<div class="flex flex-1 flex-col gap-4 p-4">
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
