// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    baseURL: "./",
    buildAssetsDir: "_nuxt",
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
    prerender: {
      routes: ["/"],
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
  ssr: false,

  // Vite configuration for better Electron bundling
  vite: {
    build: {
      rollupOptions: {
        output: {
          // Bundle everything into fewer files for Electron
          manualChunks: undefined,
        },
      },
    },
  },
});
