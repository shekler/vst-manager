<template>
	<div class="flex flex-col h-screen">
		<div class="flex flex-1">
			<SiteSidebar class="shrink-0" />
			<main class="grow max-h-dvh overflow-y-auto">
				<section class="bg-zinc-100 h-full">
					<slot />
				</section>
				<SiteFooter />
			</main>
		</div>
	</div>
</template>

<script lang="ts" setup></script>

<style></style>
