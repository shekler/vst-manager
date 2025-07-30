// Default VST plugin paths for Windows (client-side)
export const defaultVstPaths = [
  "C:\\Program Files (x86)\\Steinberg\\VstPlugins", // VST2 (32-bit plugins on 64-bit Windows)
  "C:\\Program Files\\VSTPlugins", // VST2 (64-bit plugins on 64-bit Windows)
  "C:\\Program Files\\Common Files\\VST2", // VST2 (common locations)
  "C:\\Program Files\\Common Files\\VST3", // VST3 (64-bit plugins on 64-bit Windows)
  "C:\\Program Files (x86)\\Common Files\\VST3", // VST3 (32-bit plugins on 64-bit Windows)
].join(",");
