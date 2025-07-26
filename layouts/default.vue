<template>
  <div class="bg-jet flex h-dvh flex-col gap-8 p-12">
    <SiteHeader />
    <div class="flex h-full items-stretch overflow-auto">
      <SiteSidebar class="from-onyx to-onyx/50 h-full w-fit rounded-lg bg-gradient-to-br" />
      <main class="flex grow flex-col gap-4 overflow-y-auto mask-b-from-95% mask-b-to-100%">
        <section class="text-powder rounded-lg p-8">
          <slot />
        </section>
        <SiteFooter class="" />
      </main>
    </div>
    <Toast />
  </div>
</template>

<script lang="ts" setup>
// Check for persistent toasts on page load
const { checkPersistentToast } = useToast();

onMounted(() => {
  checkPersistentToast();
});
</script>

<style></style>
