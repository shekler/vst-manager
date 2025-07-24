// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    baseURL: process.env.NODE_ENV === "production" ? "./" : "/",
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "VST Manager",
      htmlAttrs: {
        lang: "en",
      },
      meta: [
        {
          "http-equiv": "Content-Security-Policy",
          content: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:* ws://localhost:*; frame-src 'none'; object-src 'none';",
        },
      ],
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
    // Ensure API endpoints work in electron
    experimental: {
      wasm: true,
    },
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
