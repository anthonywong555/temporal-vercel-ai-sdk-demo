<script lang="ts">
  import * as Item from "$lib/components/ui/item/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import type { PageProps } from "../../routes/$types";
  
  export let workflows;
  export let startChat;

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
    <Button variant="outline" size="sm" onclick={() => startChat({workflowType: workflow.workflowType, prompt: workflow.prompt})}>Chat</Button>
    </Item.Actions>
  </Item.Root>
  {/each}
</div>