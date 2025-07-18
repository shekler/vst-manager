<!-- components/VstScanner.vue -->
<template>
  <div class="vst-scanner">
    <div class="input-group">
      <label for="directory">VST Plugin Directory:</label>
      <input
        id="directory"
        v-model="directoryPath"
        type="text"
        placeholder="C:\Program Files\Common Files\VST3"
      />
    </div>

    <button @click="scanPlugins" :disabled="isScanning">
      {{ isScanning ? "Scanning..." : "Scan Plugins" }}
    </button>

    <div v-if="results" class="results">
      <h3>Scan Results</h3>
      <p>Total plugins: {{ results.totalPlugins }}</p>
      <p>Valid plugins: {{ results.validPlugins }}</p>

      <div class="plugins-list">
        <div
          v-for="plugin in results.plugins"
          :key="plugin.path"
          class="plugin-item"
          :class="{ invalid: !plugin.isValid }"
        >
          <h4>{{ plugin.name || "Unknown Plugin" }}</h4>
          <p v-if="plugin.isValid">
            Vendor: {{ plugin.vendor }}<br />
            Version: {{ plugin.version }}<br />
            Category: {{ plugin.category }}
          </p>
          <p v-else class="error">Error: {{ plugin.error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const directoryPath = ref("");
const isScanning = ref(false);
const results = ref(null);

async function scanPlugins() {
  if (!directoryPath.value) {
    alert("Please enter a directory path");
    return;
  }

  isScanning.value = true;
  results.value = null;

  try {
    const response = await $fetch("/api/scan-vst", {
      method: "POST",
      body: {
        directoryPath: directoryPath.value,
      },
    });

    results.value = response.data;
  } catch (error) {
    console.error("Scan failed:", error);
    alert(`Scan failed: ${error.message}`);
  } finally {
    isScanning.value = false;
  }
}
</script>

<style scoped>
.vst-scanner {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.input-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.results {
  margin-top: 20px;
}

.plugins-list {
  max-height: 400px;
  overflow-y: auto;
}

.plugin-item {
  border: 1px solid #ddd;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
}

.plugin-item.invalid {
  border-color: #dc3545;
  background: #f8d7da;
}

.error {
  color: #dc3545;
}
</style>
