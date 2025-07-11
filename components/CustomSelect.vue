<template>
  <div class="custom-select-container relative">
    <!-- Select Button -->
    <button
      @click="toggleDropdown"
      @blur="handleBlur"
      type="button"
      class="c-input c-input--select flex w-full items-center justify-between"
      :class="{ 'ring-mint ring-2': isOpen }"
    >
      <span class="text-powder/90">
        {{ selectedLabel || placeholder }}
      </span>
      <IconChevronDown class="duration-200" :class="{ 'rotate-180': isOpen }" />
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      class="border-powder/20 bg-onyx absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border shadow-lg"
    >
      <!-- Search input for large lists -->
      <div
        v-if="showSearch"
        class="border-powder/10 bg-onyx sticky top-0 border-b p-2"
      >
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search..."
          class="c-input c-input--search w-full text-sm"
          @click.stop
        />
      </div>

      <!-- Options -->
      <div class="py-1">
        <button
          v-for="option in filteredOptions"
          :key="option.value"
          @click="selectOption(option)"
          @mousedown.prevent
          class="hover:bg-powder/10 focus:bg-powder/10 flex w-full cursor-pointer items-center px-4 py-2 text-left text-sm transition-colors duration-150 focus:outline-none"
          :class="{
            'bg-mint/20 text-mint': option.value === modelValue,
            'text-powder/70': option.value !== modelValue,
          }"
        >
          <span class="flex-1">{{ option.label }}</span>
          <svg
            v-if="option.value === modelValue"
            class="text-mint h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </button>
      </div>

      <!-- No results message -->
      <div
        v-if="filteredOptions.length === 0"
        class="text-powder/50 px-4 py-2 text-sm"
      >
        No options found
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { IconChevronDown } from "@tabler/icons-vue";

interface Option {
  value: string;
  label: string;
}

interface Props {
  modelValue?: string;
  options: Option[];
  placeholder?: string;
  showSearch?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Select an option",
  showSearch: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const isOpen = ref(false);
const searchTerm = ref("");

// Computed properties
const selectedLabel = computed(() => {
  const selected = props.options.find(
    (option) => option.value === props.modelValue,
  );
  return selected?.label;
});

const filteredOptions = computed(() => {
  if (!props.showSearch || !searchTerm.value) {
    return props.options;
  }

  return props.options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.value.toLowerCase()),
  );
});

// Methods
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchTerm.value = "";
    nextTick(() => {
      // Focus search input if available
      const searchInput = document.querySelector(
        'input[placeholder="Search..."]',
      ) as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    });
  }
};

const selectOption = (option: Option) => {
  emit("update:modelValue", option.value);
  isOpen.value = false;
  searchTerm.value = "";
};

const handleBlur = () => {
  // Only close if we're not clicking inside the dropdown
  setTimeout(() => {
    const activeElement = document.activeElement;
    const isClickingInside = activeElement?.closest(".custom-select-container");
    if (!isClickingInside) {
      isOpen.value = false;
      searchTerm.value = "";
    }
  }, 150);
};

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as Element;
  const selectContainer = target.closest(".custom-select-container");
  if (!selectContainer) {
    isOpen.value = false;
    searchTerm.value = "";
  }
};

// Watch for external changes
watch(
  () => props.modelValue,
  () => {
    if (!props.modelValue) {
      searchTerm.value = "";
    }
  },
);

// Lifecycle
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
