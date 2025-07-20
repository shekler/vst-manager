// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    baseURL: "./",
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "VST Manager",
      htmlAttrs: {
        lang: "en",
      },
    },
  },
  css: ["~/assets/css/main.css"],
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: ["@nuxt/image", "@nuxt/devtools", "@nuxtjs/tailwindcss"],

  // Optimizations for Electron
  nitro: {
    // Reduce bundle size for Electron
    minify: true,
  },

  // Runtime config for version info
  runtimeConfig: {
    public: {
      version: process.env.npm_package_version || "1.0.0",
    },
  },

  // Build optimizations
  build: {
    // Reduce bundle size
    transpile: ["@tabler/icons-vue"],
  },
});
