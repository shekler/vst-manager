module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
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

        console.log("Files copied successfully");
      } catch (error) {
        console.error("Error copying files:", error);
        throw error;
      }
    },
  },
};
