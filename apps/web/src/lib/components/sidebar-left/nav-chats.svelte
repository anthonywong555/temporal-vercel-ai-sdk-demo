<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { Query } from 'zero-svelte';
	import { get_z } from '$lib/z.svelte';
	
	const z = get_z();
	const conversations = new Query(z.query.ConversationSchema.orderBy('createdAt', 'desc'));
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
	<Sidebar.GroupLabel>Chats</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each conversations.current as conversation}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						{#snippet child({ props })}
							<a href="/chat/{conversation.id}" {...props}>
								<span>{conversation.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
	</Sidebar.Menu>
</Sidebar.Group>
