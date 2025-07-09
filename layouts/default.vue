<template>
	<div class="flex flex-col">
		<div class="grid grid-cols-12 h-dvh">
			<SiteSidebar class="col-span-3" />
			<main class="col-span-9 h-dvh overflow-y-auto flex flex-col">
				<section class="bg-gradient-to-br from-onyx to-jet grow text-white">
					<slot />
				</section>
				<SiteFooter />
			</main>
		</div>
	</div>
</template>

<script lang="ts" setup></script>

<style></style>
