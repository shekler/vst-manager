<template>
	<div class="flex flex-col h-screen">
		<div class="flex flex-1">
			<SiteSidebar class="shrink-0" />
			<main class="grow overflow-y-auto">
				<slot />
			</main>
		</div>
		<SiteFooter />
	</div>
</template>

<script lang="ts" setup></script>

<style></style>
