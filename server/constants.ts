// Default VST plugin paths for Windows
export const defaultVstPaths = [
  "C:\\Program Files (x86)\\Steinberg\\VstPlugins", // VST2 (32-bit plugins on 64-bit Windows)
  "C:\\Program Files\\VSTPlugins", // VST2 (64-bit plugins on 64-bit Windows)
  "C:\\Program Files\\Common Files\\VST2", // VST2 (common locations)
  "C:\\Program Files\\Common Files\\VST3", // VST3 (64-bit plugins on 64-bit Windows)
  "C:\\Program Files (x86)\\Common Files\\VST3", // VST3 (32-bit plugins on 64-bit Windows)
].join(",");

// Default settings configuration
export const defaultSettings = [
  {
    key: "vst_paths",
    value: defaultVstPaths,
    description: "Comma-separated list of directories containing VST plugins",
  },
];
