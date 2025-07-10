<template>
  <footer
    class="text-mint/30 flex items-center justify-start px-4 py-2 text-sm"
  >
    <span>version {{ version }}</span>
  </footer>
</template>

<script lang="ts" setup>
const config = useRuntimeConfig();
const version = config.public.version;
</script>
