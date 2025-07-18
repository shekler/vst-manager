<!-- components/Modal.vue -->
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" @click="handleBackdropClick">
      <div class="from-onyx to-onyx/90 border-powder/20 relative max-w-md rounded-lg border bg-gradient-to-br p-6 shadow-2xl" @click.stop>
        <!-- Header -->
        <div v-if="title" class="mb-4">
          <h3 class="text-powder/90 text-xl font-bold">{{ title }}</h3>
        </div>

        <!-- Content -->
        <div class="mb-4">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="flex gap-3">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean;
  title?: string;
  closeOnBackdrop?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  closeOnBackdrop: true,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    emit("update:modelValue", false);
  }
};
</script>
