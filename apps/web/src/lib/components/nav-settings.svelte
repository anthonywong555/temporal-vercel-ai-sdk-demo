<script lang="ts">
  import { SERVICES } from "@temporal-vercel-demo/common";
  import Settings from "@lucide/svelte/icons/settings";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { toast } from "svelte-sonner";
  import { getTemporalStatus } from "../../routes/services/data.remote";

  let open = $state(false);

  let temporal = $state(await getTemporalStatus());
  const temporalStatus = $derived(temporal.canConnectToTemporal);

  async function handleRefresh(service: SERVICES) {
    if(service === SERVICES.TEMPORAL) {
      temporal = await getTemporalStatus();
    }

    toast.info(`Refresh ${service}`);
  }
</script>
 
 <Dialog.Root bind:open>
  <Dialog.Trigger class={buttonVariants({ variant: "ghost", size: "icon" })}
   ><Settings /></Dialog.Trigger
  >
  <Dialog.Content class="sm:max-w-[425px]">
   <Dialog.Header>
    <Dialog.Title>Settings</Dialog.Title>
    <Dialog.Description>
      Show status of your connected services.
    </Dialog.Description>
   </Dialog.Header>
   <Table.Root>
    <Table.Caption></Table.Caption>
    <Table.Header>
      <Table.Row>
      <Table.Head>Services</Table.Head>
      <Table.Head>Status</Table.Head>
      <Table.Head>Actions</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell class="font-medium"><a href="{temporal.url}">Temporal</a></Table.Cell>
        <Table.Cell>
          <Badge variant="{temporalStatus ? 'secondary' : 'destructive'}" class="{temporalStatus ? 'bg-green-500': ''}">{temporalStatus ? 'Online' : 'Offline'}</Badge>
        </Table.Cell>
        <Table.Cell>
          <Button variant="outline" onclick={async () => { await handleRefresh(SERVICES.TEMPORAL) }}>Refresh</Button>
        </Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell class="font-medium">Zero</Table.Cell>
        <Table.Cell>
          <Badge variant="destructive">Offline</Badge>
        </Table.Cell>
        <Table.Cell>
          <Button variant="outline">Refresh</Button>
        </Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table.Root>
  </Dialog.Content>
 </Dialog.Root>