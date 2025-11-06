<script lang="ts">
  import * as Table from "$lib/components/ui/table/index.js";
	import type { ServiceSchema } from "$lib/schema";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  
  let { service }: { service: ServiceSchema } = $props();
  const { name, status, actions, url } = service; 
</script>

<Table.Row>
  <Table.Cell class="font-medium">
    {#if url}
      <a target="_blank" href="{url}">
        {name}
      </a>
    {:else}
      {name}
    {/if}
  </Table.Cell>
  <Table.Cell>
    <Badge variant="{status ? 'secondary' : 'destructive'}" class="{status ? 'bg-green-500': ''}">{status ? 'Online' : 'Offline'}</Badge>
  </Table.Cell>
  <Table.Cell>
    {#each actions as {action, name} }
      <Button disabled={!status} variant="outline" onclick={async () => { await action() }}>{name}</Button>
    {/each}
  </Table.Cell>
</Table.Row>