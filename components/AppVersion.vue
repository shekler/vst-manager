<template>
  <div class="flex">
    <span
      class="text-powder/50 from-powder/5 to-powder/10 rounded-lg bg-gradient-to-br px-2 py-1 text-xs opacity-80"
      >version {{ version }}</span
    >
  </div>
</template>

<script lang="ts" setup>
const config = useRuntimeConfig();
const version = config.public.version;
</script>
