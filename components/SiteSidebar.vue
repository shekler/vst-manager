<template>
	<aside class="p-12 flex flex-col gap-12 justify-between bg-jet text-powder text-lg">
		<section class="flex flex-col gap-24">
			<NuxtImg src="/plugin_manager.png" alt="Logo" class="w-fit h-fit max-h-12" />
			<nav>
				<ul class="flex flex-col gap-10">
					<li class="flex items-center gap-4"><IconBooks class="size-8 rounded-full bg-powder p-1 text-black" /> Library</li>
					<li class="flex items-center gap-4"><IconBell class="size-8 rounded-full bg-powder p-1 text-black" /> Updates</li>
					<li class="flex items-center gap-4"><IconSearch class="size-8 rounded-full bg-powder p-1 text-black" /> Search</li>
				</ul>
			</nav>
		</section>
		<nav>
			<ul class="flex flex-col gap-10">
				<li class="flex items-center gap-4"><IconUser class="size-8 rounded-full bg-powder p-1 text-black" /> User</li>
				<li class="flex items-center gap-4"><IconSettings class="size-8 rounded-full bg-powder p-1 text-black" /> Settings</li>
			</ul>
		</nav>
	</aside>
</template>

<script lang="ts" setup>
import { IconBooks, IconBell, IconSearch, IconUser, IconSettings } from "@tabler/icons-vue";
</script>
