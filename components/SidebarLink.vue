<template>
  <router-link
    class="hover:text-mint flex w-full items-center gap-4 rounded-lg border border-transparent px-5 py-3 duration-200"
    :to="to"
    :class="{
      'from-mint/10 to-mint/20 text-mint !border-mint/30 bg-gradient-to-br':
        $route.path === to,
    }"
  >
    <slot />
  </router-link>
</template>

<script lang="ts" setup>
import {
  IconBooks,
  IconSearch,
  IconSettings,
  IconRefresh,
} from "@tabler/icons-vue";
const props = defineProps<{
  to: string;
}>();
</script>

<style></style>
