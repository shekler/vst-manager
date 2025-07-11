// https://nuxt.com/docs/api/configuration/nuxt-config
import { readFileSync } from "fs";
import { join } from "path";

const packageJson = JSON.parse(
  readFileSync(join(__dirname, "package.json"), "utf8"),
);

export default defineNuxtConfig({
  ssr: false,
  app: {
    baseURL: "/",
  },
  css: ["~/assets/css/main.css"],
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/image",
    "@nuxt/devtools",
    "@nuxtjs/tailwindcss",
    "@pinia/nuxt",
  ],
  runtimeConfig: {
    public: {
      version: packageJson.version,
    },
  },
});
