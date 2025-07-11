<template>
  <div>
    <!-- This will show briefly while redirecting -->
    <p>Redirecting to library...</p>
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from "#app";

// Redirect to library page on mount
await navigateTo("/library");
</script>

<style scoped></style>
