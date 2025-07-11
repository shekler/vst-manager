import { defineEventHandler } from "h3";
import fs from "fs";
import path from "path";

export default defineEventHandler(async () => {
  try {
    const filePath = path.join(process.cwd(), "data", "scanned-plugins.json");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);

    return { success: true, plugins: data.plugins };
  } catch (error) {
    console.error("Failed to read plugins from JSON file:", error);
    return { success: false, message: "Failed to retrieve plugins." };
  }
});
