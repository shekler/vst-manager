// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-05-15",
	devtools: { enabled: true },
	modules: ["@nuxt/image", "@nuxt/devtools", "@nuxt/eslint", "@nuxt/ui", "@nuxtjs/tailwindcss", "@pinia/nuxt", "nuxt-electron"],
	electron: {
		build: [
			{
				// Main process entry file
				entry: "electron/main.ts",

				// 👇 ADD THIS VITE CONFIGURATION BLOCK 👇
				vite: {
					build: {
						rollupOptions: {
							// Tell rollup to treat this package as external
							external: ["vst-scanner"],
						},
					},
				},
			},
		],
	},
});
