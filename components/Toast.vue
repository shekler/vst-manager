<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" :class="['flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-md', toast.type === 'success' && 'border-mint/20 bg-mint/10 text-mint', toast.type === 'error' && 'border-red-500/20 bg-red-500/10 text-red-400', toast.type === 'info' && 'border-powder/20 bg-powder/10 text-powder']">
        <div class="flex-1">{{ toast.message }}</div>
        <button @click="removeToast(toast.id)" class="text-current/70 hover:text-current">
          <IconX class="size-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script lang="ts" setup>
import { IconX } from "@tabler/icons-vue";

const { toasts, removeToast } = useToast();
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
