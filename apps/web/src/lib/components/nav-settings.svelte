<script lang="ts">
  import Settings from "@lucide/svelte/icons/settings";
  import { MediaQuery } from "svelte/reactivity";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Drawer from "$lib/components/ui/drawer/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";

  let open = $state(false);
  const isDesktop = new MediaQuery("(min-width: 768px)");
  const id = $props.id();
</script>
 
{#if isDesktop.current}
 <Dialog.Root bind:open>
  <Dialog.Trigger class={buttonVariants({ variant: "ghost", size: "icon" })}
   ><Settings /></Dialog.Trigger
  >
  <Dialog.Content class="sm:max-w-[425px]">
   <Dialog.Header>
    <Dialog.Title>Settings</Dialog.Title>
    <Dialog.Description>
     Make changes to your profile here. Click save when you're done.
    </Dialog.Description>
   </Dialog.Header>
   <form class="grid items-start gap-4">
    <div class="grid gap-2">
     <Label for="email-{id}">Email</Label>
     <Input type="email" id="email-{id}" value="shadcn@example.com" />
    </div>
    <div class="grid gap-2">
     <Label for="username-{id}">Username</Label>
     <Input id="username-{id}" value="@shadcn" />
    </div>
    <Button type="submit">Save changes</Button>
   </form>
  </Dialog.Content>
 </Dialog.Root>
{:else}
 <Drawer.Root bind:open>
  <Drawer.Trigger class={buttonVariants({ variant: "ghost", size: 'icon' })}>
    <Settings />
  </Drawer.Trigger>
  <Drawer.Content>
   <Drawer.Header class="text-left">
    <Drawer.Title>Settings</Drawer.Title>
    <Drawer.Description>
     Make changes to your profile here. Click save when you're done.
    </Drawer.Description>
   </Drawer.Header>
   <form class="grid items-start gap-4 px-4">
    <div class="grid gap-2">
     <Label for="email-{id}">Email</Label>
     <Input type="email" id="email-{id}" value="shadcn@example.com" />
    </div>
    <div class="grid gap-2">
     <Label for="username-{id}">Username</Label>
     <Input id="username-{id}" value="@shadcn" />
    </div>
    <Button type="submit">Save changes</Button>
   </form>
   <Drawer.Footer class="pt-2">
    <Drawer.Close class={buttonVariants({ variant: "outline" })}
     >Cancel</Drawer.Close
    >
   </Drawer.Footer>
  </Drawer.Content>
 </Drawer.Root>
{/if}