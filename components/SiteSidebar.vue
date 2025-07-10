<template>
  <aside
    class="text-powder flex flex-col justify-between gap-12 p-8 text-lg shadow-xl"
  >
    <nav>
      <ul class="text-powder/80 flex flex-col items-start gap-3 font-bold">
        <li class="w-full">
          <SidebarLink to="/library">
            <IconBooks class="size-8" />
            Library
          </SidebarLink>
        </li>
        <li class="w-full">
          <SidebarLink to="/updates">
            <IconRefresh class="size-8" />
            Updates
          </SidebarLink>
        </li>
        <li class="w-full">
          <SidebarLink to="/search">
            <IconSearch class="size-8" />
            Search
          </SidebarLink>
        </li>
      </ul>
    </nav>
    <nav>
      <ul class="flex flex-col gap-10">
        <li class="-py-2 -mx-3">
          <SidebarLink to="/settings">
            <IconSettings class="size-8" />
            Settings
          </SidebarLink>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script lang="ts" setup>
import {
  IconBooks,
  IconSearch,
  IconSettings,
  IconRefresh,
} from "@tabler/icons-vue";
import SidebarLink from "./SidebarLink.vue";
</script>
