import { contextBridge, ipcRenderer } from "electron";

// ─── Window decoration mode (injected by main via additionalArguments) ────────
const decoArg   = process.argv.find(a => a.startsWith("--wolly-deco="));
const windowDeco: "server" | "client" =
  decoArg?.replace("--wolly-deco=", "") === "client" ? "client" : "server";

// ─── Progress listener handle ────────────────────────────────────────────────
type ProgressHandler = (event: {
  stage: "downloading" | "applying" | "done" | "error";
  progress?: number;
  message?: string;
}) => void;

let progressHandler: ProgressHandler | null = null;

ipcRenderer.on("wallpaper:progress", (_event, data) => {
  progressHandler?.(data);
});

// ─── Exposed API ─────────────────────────────────────────────────────────────

contextBridge.exposeInMainWorld("electronAPI", {
  // ── Platform & decoration mode (synchronous, resolved at preload time) ────
  platform:   process.platform as "linux" | "darwin" | "win32",
  windowDeco,

  // ── System info ───────────────────────────────────────────────────────────
  getSystemInfo: () => ipcRenderer.invoke("system:info"),

  // ── Wallpaper operations ──────────────────────────────────────────────────
  downloadWallpaper: (url: string, id: string) =>
    ipcRenderer.invoke("wallpaper:download", url, id),

  applyWallpaper: (filePath: string, opts: object) =>
    ipcRenderer.invoke("wallpaper:apply", filePath, opts),

  downloadAndApply: (url: string, id: string, opts: object) =>
    ipcRenderer.invoke("wallpaper:download-and-apply", url, id, opts),

  onProgress: (handler: ProgressHandler) => {
    progressHandler = handler;
  },
  removeProgressListener: () => {
    progressHandler = null;
  },

  // ── Window controls (used in CSD / frameless mode) ────────────────────────
  windowMinimize:    () => ipcRenderer.send("window:minimize"),
  windowMaximize:    () => ipcRenderer.send("window:maximize"),
  windowClose:       () => ipcRenderer.send("window:close"),
  windowIsMaximized: () => ipcRenderer.invoke("window:is-maximized"),
  onMaximizeChange:  (cb: (maximized: boolean) => void) => {
    ipcRenderer.on("window:maximized",   () => cb(true));
    ipcRenderer.on("window:unmaximized", () => cb(false));
    return () => {
      ipcRenderer.removeAllListeners("window:maximized");
      ipcRenderer.removeAllListeners("window:unmaximized");
    };
  },

  // ── App settings (window decorations, future prefs) ───────────────────────
  appSettingsGet:     () => ipcRenderer.invoke("appSettings:get"),
  appSettingsSet:     (patch: Record<string, unknown>) =>
    ipcRenderer.invoke("appSettings:set", patch),
  appSettingsRelaunch: () => ipcRenderer.invoke("appSettings:relaunch"),

  // ── Desktop integration (Linux only) ─────────────────────────────────────
  desktopStatus:       () => ipcRenderer.invoke("desktop:status"),
  desktopInstall:      () => ipcRenderer.invoke("desktop:install"),
  desktopUninstall:    () => ipcRenderer.invoke("desktop:uninstall"),
  desktopOpenLocation: () => ipcRenderer.invoke("desktop:open-location"),
});
