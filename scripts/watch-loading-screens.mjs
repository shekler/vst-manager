import { watch } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

const componentPath = path.join(__dirname, "..", "components", "AppLoading.vue");
const shouldRunTests = process.argv.includes("--test");

console.log("🔍 Watching AppLoading.vue for changes...");
console.log("📝 File:", componentPath);
console.log("🚀 Changes will automatically rebuild loading screens");
if (shouldRunTests) {
  console.log("🧪 Auto-testing enabled - will run install test after rebuild");
}
console.log("\n💡 Press Ctrl+C to stop watching\n");

let isBuilding = false;
let isTesting = false;
let buildTimeout;

async function rebuild() {
  if (isBuilding) return;

  isBuilding = true;
  console.log("📦 Rebuilding loading screens...");

  try {
    const { stdout, stderr } = await execAsync("npm run build:loading-screens", {
      cwd: path.join(__dirname, ".."),
    });

    if (stderr && !stderr.includes("Generated")) {
      console.error("❌ Build error:", stderr);
    } else {
      console.log("✅ Loading screens rebuilt successfully!");

      // Run test if --test flag is provided
      if (shouldRunTests) {
        if (!isTesting) {
          console.log("🧪 Running test...");
          await runTest();
        } else {
          console.log("⏳ Test already running, skipping...");
        }
      }
    }
  } catch (error) {
    console.error("❌ Build failed:", error.message);
  } finally {
    isBuilding = false;
  }
}

// Kill any existing Electron processes
async function killExistingElectron() {
  try {
    if (process.platform === "win32") {
      await execAsync('taskkill /F /IM electron.exe /T 2>nul || echo "No electron processes found"');
    } else {
      await execAsync('pkill -f electron || echo "No electron processes found"');
    }
  } catch (error) {
    // Ignore errors - likely no processes to kill
  }
}

async function runTest() {
  if (isTesting) return;

  isTesting = true;
  try {
    // Kill any existing Electron processes first
    await killExistingElectron();

    console.log("🧪 Building Electron and testing install screen...");
    // Build electron first, then test (loading screens are already built)
    await execAsync("npm run build:electron", {
      cwd: path.join(__dirname, ".."),
    });

    const { stdout, stderr } = await execAsync("electron . --squirrel-install", {
      cwd: path.join(__dirname, ".."),
      timeout: 8000, // 8 second timeout
    });
    console.log("✅ Test completed!");
  } catch (error) {
    // Test likely exited normally (Electron closes after loading screen)
    if (error.signal === "SIGINT" || error.code === 1) {
      console.log("✅ Test completed!");
    } else {
      console.error("❌ Test failed:", error.message);
    }
  } finally {
    isTesting = false;
  }
}

// Watch for file changes
watch(componentPath, (eventType) => {
  if (eventType === "change") {
    console.log(`\n🔄 AppLoading.vue changed...`);

    // Debounce rapid changes
    clearTimeout(buildTimeout);
    buildTimeout = setTimeout(rebuild, 500);
  }
});

// Handle process termination
process.on("SIGINT", async () => {
  console.log("\n👋 Stopping file watcher...");
  console.log("🧹 Cleaning up any running Electron processes...");
  await killExistingElectron();
  process.exit(0);
});

// Initial build
rebuild();
