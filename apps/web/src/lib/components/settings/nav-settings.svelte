<script lang="ts">
  import ServiceSetting from "./service-setting.svelte";
  import Settings from "@lucide/svelte/icons/settings";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { getTemporalStatus } from "../../../routes/services/data.remote";
  import { getStatus as getDBStatus, reset as resetDB } from '../../../routes/services/database/data.remote';
	import { getStatus as getZeroStatus } from "../../../routes/services/local-first/data.remote";
  import type { ServiceSchema } from "$lib/schema";
	import { toast } from "svelte-sonner";

  // Building an array of services
  let open = $state(false);
  const temporal = await getTemporalStatus();
  const zeroStatus = await getZeroStatus();
  let postgresStatus = await getDBStatus();

  const services:ServiceSchema[] = [
    {
      name: 'Temporal',
      status: temporal.canConnectToTemporal,
      url: temporal.url,
      actions: [
        {
          name: 'Dashboard',
          action: () => window.open(temporal.url, '_blank')
        }
      ]
    },
    {
      name: 'Zero',
      status: zeroStatus
    },
    {
      name: 'Postgres',
      status: postgresStatus,
      actions: [
        {
          name: 'Reset',
          action: async () => {
            try {
              await resetDB();
              await toast.info('Reset DB.');
            } catch(e) {
              await toast.error('Failed to reset DB.');
            }
          }
        }
      ]
    }
  ]

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
      {#each services as service }
        <ServiceSetting {service} />
      {/each}
    </Table.Body>
  </Table.Root>
  </Dialog.Content>
 </Dialog.Root>