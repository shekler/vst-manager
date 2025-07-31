<template>
  <div class="squirrel-loading">
    <div class="spinner" />
    <h2 class="title">VST Manager</h2>
    <p class="message">{{ message }}</p>
    <div class="progress-bar">
      <div class="progress-fill" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message: string;
}

defineProps<Props>();
</script>

<style scoped>
.squirrel-loading {
  margin: 0;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 160px;
  text-align: center;
  overflow: hidden;
}

.spinner {
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 3px solid white;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.message {
  margin: 0 0 15px 0;
  opacity: 0.9;
  font-size: 14px;
  animation: fadeInOut 2s ease-in-out infinite;
}

.progress-bar {
  width: 200px;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  border-radius: 2px;
  animation: progressFill 2s ease-in-out infinite;
}

@keyframes fadeInOut {
  0%,
  100% {
    opacity: 0.9;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes progressFill {
  0% {
    width: 0%;
    transform: translateX(-100%);
  }
  50% {
    width: 100%;
    transform: translateX(0%);
  }
  100% {
    width: 100%;
    transform: translateX(100%);
  }
}

/* Make sure body fills the screen */
:global(body) {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
}

:global(html) {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}
</style>
