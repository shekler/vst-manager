// Execute vst_scanner with file path from settings.vue
import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync } from "fs";
import { readdir } from "fs/promises";
import { join } from "path";

const execAsync = promisify(exec);

export default defineEventHandler(async (event) => {
  try {
    const scannerPath = join(process.cwd(), "tools/vst_scanner.exe");
    const outputPath = join(process.cwd(), "data/scanned-plugins.json");
    const directoryPath = "E:\\Recording\\VSTPlugins";

    const command = `"${scannerPath}" "${directoryPath}" -o "${outputPath}"`;
    console.log(`Executing command: ${command}`);

    // Execute the scanner
    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error("Scanner stderr:", stderr);
    }

    // Read the results from the output file
    const results = JSON.parse(readFileSync(outputPath, "utf8"));

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error("Scan failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
});
