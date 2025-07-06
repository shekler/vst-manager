// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	ssr: false,
	app: {
		baseURL: "/",
	},
	compatibilityDate: "2025-05-15",
	devtools: { enabled: true },
	modules: ["@nuxt/image", "@nuxt/devtools", "@nuxt/eslint", "@nuxt/ui", "@nuxtjs/tailwindcss", "@pinia/nuxt"],
});
