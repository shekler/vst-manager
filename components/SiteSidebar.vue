<template>
  <aside class="text-powder flex flex-col justify-between gap-12 p-8 text-lg shadow-xl">
    <nav>
      <ul class="text-powder/80 flex flex-col items-start gap-3 font-bold">
        <li class="w-full">
          <SidebarLink to="/">
            <IconBooks class="size-8" />
            Library
          </SidebarLink>
        </li>
        <li class="w-full">
          <SidebarLink to="/settings">
            <IconSettings class="size-8" />
            Settings
          </SidebarLink>
        </li>
      </ul>
    </nav>
    <a href="https://www.vstmanager.com" target="_blank" class="text-powder/80 hover:text-powder flex items-center gap-1 self-center text-sm duration-100">Dev blog <IconExternalLink class="size-4" /></a>
  </aside>
</template>

<script lang="ts" setup>
import { IconBooks, IconSettings, IconExternalLink } from "@tabler/icons-vue";
import SidebarLink from "./SidebarLink.vue";
</script>
