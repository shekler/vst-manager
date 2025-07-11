<template>
  <div class="bg-jet flex h-dvh flex-col gap-8 p-12">
    <SiteHeader />
    <div class="flex max-h-full overflow-auto">
      <SiteSidebar
        class="from-onyx to-onyx/50 w-fit rounded-lg bg-gradient-to-br"
      />
      <main class="flex grow flex-col gap-4 overflow-y-auto">
        <section class="text-powder rounded-lg p-8">
          <slot />
        </section>
        <SiteFooter class="" />
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup></script>

<style></style>
