<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import Sun from "@lucide/svelte/icons/sun";
  import Moon from "@lucide/svelte/icons/moon";
  import { toggleMode } from "mode-watcher";
</script>

<Sidebar.Menu>
  <Sidebar.MenuButton class="dark:hidden" onclick={toggleMode}>
    <Sun /> Day
  </Sidebar.MenuButton>
  <Sidebar.MenuButton class="hidden dark:flex" onclick={toggleMode}>
    <Moon /> Night
  </Sidebar.MenuButton>
</Sidebar.Menu>