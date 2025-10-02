<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { useSidebar } from "$lib/components/ui/sidebar/index.js";

	const sidebar = useSidebar();
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
	<Sidebar.GroupLabel>Chats</Sidebar.GroupLabel>
	<Sidebar.Menu>
	</Sidebar.Menu>
</Sidebar.Group>
