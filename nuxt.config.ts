// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	ssr: false,
	app: {
		baseURL: "/",
	},
	css: ["~/assets/css/main.css"],
	compatibilityDate: "2025-05-15",
	devtools: { enabled: true },
	modules: ["@nuxt/image", "@nuxt/devtools", "@nuxtjs/tailwindcss", "@pinia/nuxt"],
});
