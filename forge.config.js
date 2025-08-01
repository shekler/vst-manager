const path = require("path");

module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: process.platform === "win32" ? ["./tools/vst_scanner.exe"] : [],
    icon: path.join(__dirname, "public", "icon"),
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        iconUrl: path.join(__dirname, "public", "icon.ico"),
        setupIcon: path.join(__dirname, "public", "install.ico"),
        loadingGif: path.join(__dirname, "public", "install-loading.gif"),
      },
    },
    {
      name: "@electron-forge/maker-pkg",
      config: {
        iconUrl: path.join(__dirname, "public", "icon.icns"),
        setupIcon: path.join(__dirname, "public", "install.icns"),
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
  ],
  hooks: {
    packageAfterCopy: async (config, buildPath) => {
      // Copy the built main process files to the build directory root
      const { copyFileSync } = require("fs");
      const { join } = require("path");
      const { copySync } = require("fs-extra");

      try {
        console.log("Copying files from dist to build directory...");
        console.log("Build path:", buildPath);

        // Copy main process files to root
        copyFileSync(join(__dirname, "dist", "main.js"), join(buildPath, "main.js"));
        copyFileSync(join(__dirname, "dist", "preload.js"), join(buildPath, "preload.js"));

        // Copy server API files
        copySync(join(__dirname, "dist", "server"), join(buildPath, "server"));

        // Copy the entire .output directory to the build directory
        copySync(join(__dirname, ".output"), join(buildPath, ".output"));

        // Copy loading screens for Squirrel events
        const loadingScreensPath = join(__dirname, "dist", "loading-screens");
        if (require("fs").existsSync(loadingScreensPath)) {
          copySync(loadingScreensPath, join(buildPath, "loading-screens"));
          console.log("Loading screens copied successfully");
        }

        // Note: vst_scanner.exe is now handled by extraResource in packagerConfig

        console.log("Files copied successfully");
      } catch (error) {
        console.error("Error copying files:", error);
        throw error;
      }
    },
  },
};
