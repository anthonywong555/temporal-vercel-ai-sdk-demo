<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import GalleryVerticalEndIcon from "@lucide/svelte/icons/gallery-vertical-end";
  import type { ComponentProps } from "svelte";
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <Sidebar.MenuButton size="lg">
      {#snippet child({ props })}
        <a href="##" {...props}>
          <div
            class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
          >
            <GalleryVerticalEndIcon class="size-4" />
          </div>
          <div class="flex flex-col gap-0.5 leading-none">
            <span class="font-medium">Temporal</span>
          </div>
        </a>
      {/snippet}
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
</Sidebar.Menu>