// https://nuxt.com/docs/api/configuration/nuxt-config
import { readFileSync } from "fs";
import { join } from "path";

const packageJson = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf8"));

export default defineNuxtConfig({
  ssr: false,
  app: {
    baseURL: "/",
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "VST Manager",
      htmlAttrs: {
        lang: "en",
      },
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
  devtools: { enabled: true },
  modules: ["@nuxt/image", "@nuxt/devtools", "@nuxtjs/tailwindcss"],
  runtimeConfig: {
    public: {
      version: packageJson.version,
    },
  },
});
