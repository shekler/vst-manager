<template>
  <div class="flex gap-2">
    <button class="c-button c-button--clear w-fit" @click="showImportDialog">Import JSON</button>
    <button class="c-button c-button--clear w-fit" @click="exportPlugins">Export JSON</button>

    <!-- Hidden file input -->
    <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileSelect" />
  </div>

  <!-- Import Warning Modal -->
  <ModalWindow v-model="showWarningModal" title="Import Warning" :close-on-backdrop="false">
    <div class="text-powder/80">
      <p class="mb-4"><strong class="text-red-400">Warning:</strong> Importing a JSON file will completely overwrite your current plugin database.</p>
      <p class="mb-4">This action will:</p>
      <ul class="mb-4 list-inside list-disc space-y-1 text-sm">
        <li>Replace all existing plugins in the database</li>
        <li>Overwrite any custom keys you may have set</li>
        <li>Cannot be undone</li>
      </ul>
      <p class="text-sm">Are you sure you want to proceed?</p>
    </div>

    <template #footer>
      <button class="c-button c-button--clear" @click="showWarningModal = false">Cancel</button>
      <button class="c-button c-button--danger" @click="confirmImport">Import & Overwrite</button>
    </template>
  </ModalWindow>

  <!-- Error Modal -->
  <ModalWindow v-model="showErrorModal" title="Import Error">
    <div class="text-powder/80">
      <p>{{ errorMessage }}</p>
    </div>

    <template #footer>
      <button class="c-button c-button--clear" @click="showErrorModal = false">OK</button>
    </template>
  </ModalWindow>
</template>

<script lang="ts" setup>
const showErrorModal = ref(false);
const showWarningModal = ref(false);
const errorMessage = ref("");
const fileInput = ref<HTMLInputElement>();
const selectedFile = ref<File | null>(null);

const { success, error: showError } = useToast();

function showImportDialog() {
  fileInput.value?.click();
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    selectedFile.value = file;
    showWarningModal.value = true;
  }

  // Reset the input so the same file can be selected again
  target.value = "";
}

async function confirmImport() {
  if (!selectedFile.value) {
    errorMessage.value = "No file selected";
    showErrorModal.value = true;
    return;
  }

  try {
    const formData = new FormData();
    formData.append("file", selectedFile.value);

    const response = await $fetch("/api/vst/import", {
      method: "POST",
      body: formData,
    });

    if (response.success) {
      const count = "count" in response ? response.count : 0;
      success(`Successfully imported ${count} plugins!`);
      showWarningModal.value = false;
      selectedFile.value = null;

      // Refresh the page to show the new data
      window.location.reload();
    } else {
      errorMessage.value = "error" in response && typeof response.error === "string" ? response.error : "Failed to import plugins";
      showErrorModal.value = true;
    }
  } catch (error) {
    console.error("Import failed:", error);
    errorMessage.value = "Failed to import plugins";
    showErrorModal.value = true;
  }
}

async function exportPlugins() {
  try {
    const response = await $fetch("/api/vst/export");
    if (response.success && "filePath" in response) {
      success("Plugins exported successfully!");
      await downloadFile(response.filePath);
    } else {
      errorMessage.value = "error" in response && typeof response.error === "string" ? response.error : "Failed to export plugins";
      showErrorModal.value = true;
    }
  } catch (error) {
    console.error("Export failed:", error);
    errorMessage.value = "Failed to export plugins";
    showErrorModal.value = true;
  }
}

async function downloadFile(filePath: string) {
  try {
    // Fetch the file content from the server
    const fileResponse = await $fetch(`/api/vst/download?filePath=${encodeURIComponent(filePath)}`, {
      method: "GET",
    });

    if (fileResponse.success && "data" in fileResponse && fileResponse.data) {
      // Create a blob from the JSON data
      const blob = new Blob([JSON.stringify(fileResponse.data, null, 2)], {
        type: "application/json",
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "exported-plugins.json";

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      throw new Error("Failed to fetch file data");
    }
  } catch (error) {
    console.error("Download failed:", error);
    errorMessage.value = "Failed to download file";
    showErrorModal.value = true;
  }
}
</script>

<style></style>
