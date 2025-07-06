import { app as e, ipcMain as a, BrowserWindow as t } from "electron";
import n from "path";
import { fileURLToPath as c } from "node:url";
import l from "vst-scanner";
const { Scanner: m } = l, p = c(import.meta.url), i = n.dirname(p);
process.env.ROOT = n.join(i, "..");
process.env.DIST = n.join(process.env.ROOT, "dist-electron");
let s;
function d() {
  s = new t({
    webPreferences: {
      // The preload script is essential for the ipcRenderer bridge
      preload: n.join(i, "preload.js")
    }
  });
  const o = process.env.VITE_DEV_SERVER_URL;
  s.loadURL(o);
}
e.on("ready", () => {
  d(), a.handle("scan-vsts", async () => {
    console.log("Received scan-vsts event from renderer.");
    const r = await new m().scan(
      {
        win32: ["C:\\Program Files\\Common Files\\VST3", "C:\\Program Files\\Steinberg\\VstPlugins"],
        darwin: ["/Library/Audio/Plug-Ins/VST", "/Library/Audio/Plug-Ins/VST3", "/Library/Audio/Plug-Ins/Components"]
      }[process.platform] ?? []
    );
    return console.log(`Scan complete. Found ${r.vst3.length} VST3 plugins.`), r;
  });
});
e.on("window-all-closed", () => {
  process.platform !== "darwin" && e.quit();
});
