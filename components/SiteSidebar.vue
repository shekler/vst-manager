<template>
	<aside class="p-12 flex flex-col gap-12 justify-between bg-jet text-white">
		<section class="flex flex-col gap-12">
			<NuxtImg src="/plugin_manager.png" alt="Logo" class="w-fit h-fit max-h-12" />
			<nav>
				<ul class="flex flex-col gap-6">
					<li class="flex items-center gap-2"><IconBooks /> Library</li>
					<li class="flex items-center gap-2"><IconBell /> Updates</li>
					<li class="flex items-center gap-2"><IconSearch /> Search</li>
				</ul>
			</nav>
		</section>
		<nav>
			<ul class="flex flex-col gap-6">
				<li class="flex items-center gap-2"><IconUser /> User</li>
				<li class="flex items-center gap-2"><IconSettings /> Settings</li>
			</ul>
		</nav>
	</aside>
</template>

<script lang="ts" setup>
import { IconBooks, IconBell, IconSearch, IconUser, IconSettings } from "@tabler/icons-vue";
</script>
