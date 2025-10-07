<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import MessageSquareHeart from "@lucide/svelte/icons/message-square-heart";
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <Sidebar.MenuButton size="lg">
      {#snippet child({ props })}
        <a href="/" {...props}>
          <div
            class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
          >
            <MessageSquareHeart class="size-4" />
          </div>
          <div class="flex flex-col gap-0.5 leading-none">
            <span class="font-medium">Temporal Chat Demo</span>
          </div>
        </a>
      {/snippet}
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
</Sidebar.Menu>