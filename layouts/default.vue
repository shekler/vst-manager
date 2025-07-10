<template>
  <div class="bg-jet flex h-dvh flex-col gap-8 p-12">
    <SiteHeader />
    <div class="flex h-full gap-12">
      <SiteSidebar
        class="from-onyx to-onyx/50 w-fit shrink-0 rounded-lg bg-gradient-to-br"
      />
      <main class="flex h-full grow flex-col gap-4 overflow-y-auto">
        <section class="text-powder grow rounded-lg">
          <slot />
        </section>
        <SiteFooter class="" />
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup></script>

<style></style>
