<template>
  <div class="squirrel-window">
    <div class="squirrel-container">
      <h1 class="title">VST Manager</h1>
      <p class="message">{{ message }}</p>
      <div class="progress-bar">
        <div class="progress-fill" />
      </div>
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
.squirrel-window {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #101112;
  color: #f9f7f2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  text-align: center;
  overflow: hidden;
}

.squirrel-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  text-align: center;
  overflow: hidden;
  background: linear-gradient(135deg, #41c49d20 0%, #101112 50%, #20bfcf20 100%);
}

.title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
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
