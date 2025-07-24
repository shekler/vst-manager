import { readFile } from "node:fs/promises";

// Get plugins from scanned-plugins.json
export default defineEventHandler(async (event) => {
  const plugins = await readFile("./data/scanned-plugins.json", "utf8");
  return JSON.parse(plugins);
});
