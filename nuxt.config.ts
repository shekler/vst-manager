// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  nitro: {
    preset: "static",
  },
  app: {
    baseURL: "./",
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
          content: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:*; font-src 'self' data:;",
        },
      ],
      link: [
        { rel: "icon", type: "image/png", href: "/favicon/favicon-96x96.png", sizes: "96x96" },
        { rel: "icon", type: "image/svg+xml", href: "/favicon/favicon.svg" },
        { rel: "shortcut icon", type: "image/x-icon", href: "/favicon/favicon.ico" },
        { rel: "apple-touch-icon", href: "/favicon/apple-touch-icon.png", sizes: "180x180" },
        { rel: "manifest", href: "/favicon/site.webmanifest" },
      ],
    },
  },
  css: ["~/assets/css/main.css"],
  compatibilityDate: "2025-05-15",
  devtools: { enabled: process.env.NODE_ENV === "development" },
  modules: ["@nuxt/image", "@nuxt/devtools", "@nuxtjs/tailwindcss"],
  runtimeConfig: {
    public: {
      version: process.env.npm_package_version || "1.0.0",
    },
  },
});
