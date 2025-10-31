<script lang="ts">
  import * as Item from "$lib/components/ui/item/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import type { PageProps } from "../../routes/$types";
  
  let {workflows, startChat} = $props(); 

  let clickedChat = $state('');
  
  async function onClickStartChat(workflow:any) {
    const {title, workflowType, prompt} = workflow;
    clickedChat = title;
    await startChat({workflowType, prompt});
  }

</script>
 
<div class="flex flex-col gap-6">
  {#each workflows as workflow }
  <Item.Root variant="outline">
    <Item.Content>
    <Item.Title>{workflow.title}</Item.Title>
    <Item.Description>
      {workflow.description}
    </Item.Description>
    </Item.Content>
    <Item.Actions>
    <Button disabled={clickedChat === workflow.title} variant="outline" size="sm" onclick={() => onClickStartChat(workflow)}>
      {#if clickedChat === workflow.title}
        <Loader2Icon class="animate-spin" />
      {/if}
      Chat
    </Button>
    </Item.Actions>
  </Item.Root>
  {/each}
</div>