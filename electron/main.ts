import {
  app, BrowserWindow, ipcMain, shell, nativeTheme, Menu,
} from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { registerSystemHandlers }      from "./ipc/system";
import { registerWallpaperHandlers }   from "./ipc/wallpaper";
import { registerDesktopHandlers }     from "./ipc/desktop";
import {
  readAppSettings,
  registerAppSettingsHandlers,
} from "./ipc/appSettings";

// ─── ESM __dirname shim ──────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Paths ───────────────────────────────────────────────────────────────────
const DIST    = path.join(__dirname, "../dist");
const DEV_URL = process.env["VITE_DEV_SERVER_URL"];
const isDev   = !!DEV_URL;

// ─── Read persisted app settings (sync — must be before GPU process start) ───
//
// We need this now so we can:
//   1. Set `WaylandWindowDecorations` only when the user wants SSD
//   2. Pass the chosen decoration mode to the renderer via additionalArguments
const appSettings   = readAppSettings();
const windowDeco    = appSettings.windowDecorations;         // "server" | "client"
const wantNativeFrame = windowDeco === "server";             // false → custom TitleBar

// ─── Hardware acceleration ────────────────────────────────────────────────────
// Must be set BEFORE app.whenReady() / before the GPU process is spawned.
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");
app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-accelerated-video-decode");
app.commandLine.appendSwitch("enable-accelerated-video-encode");
app.commandLine.appendSwitch("disable-frame-rate-limit");

// ─── Platform-specific display backend ───────────────────────────────────────
if (process.platform === "linux") {
  const sessionType    = process.env["XDG_SESSION_TYPE"] ?? "";
  const waylandDisplay = process.env["WAYLAND_DISPLAY"]  ?? "";
  const isWayland      = sessionType === "wayland" || !!waylandDisplay;

  if (isWayland) {
    app.commandLine.appendSwitch("ozone-platform", "wayland");

    // WaylandWindowDecorations = ask the compositor to draw server-side
    // decorations. Only enable when the user chose SSD; if they chose CSD,
    // the app draws its own TitleBar and we must NOT request SSD or the
    // compositor will draw a second title bar on top.
    const waylandFeatures = wantNativeFrame
      ? "WaylandWindowDecorations,VaapiVideoDecoder,VaapiVideoEncoder"
      : "VaapiVideoDecoder,VaapiVideoEncoder";

    app.commandLine.appendSwitch("enable-features", waylandFeatures);
    app.commandLine.appendSwitch("enable-wayland-ime");
    console.log(`[Wolly] Wayland – decorations: ${windowDeco}`);
  } else {
    app.commandLine.appendSwitch("ozone-platform", "x11");
    app.commandLine.appendSwitch("enable-features", "VaapiVideoDecoder,VaapiVideoEncoder");
    console.log(`[Wolly] X11 – decorations: ${windowDeco}`);
  }
}

// ─── Window ──────────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const isMac     = process.platform === "darwin";
  const isLinux   = process.platform === "linux";

  // macOS always uses hidden-inset (native traffic lights, content extends up).
  // Linux/Windows: native frame when SSD, frameless when CSD.
  const useCSD = isLinux && !wantNativeFrame;

  mainWindow = new BrowserWindow({
    width:     1320,
    height:    860,
    minWidth:  980,
    minHeight: 620,
    title:     "Wolly",

    // ── Window chrome ─────────────────────────────────────────────────────
    ...(isMac
      ? { titleBarStyle: "hiddenInset" as const, trafficLightPosition: { x: 16, y: 14 } }
      : useCSD
        ? { frame: false }    // Electron draws zero chrome; TitleBar.tsx does it
        : {}),                // frame:true (default) — OS/compositor draws chrome

    backgroundColor: "#0a0818",
    show: false,

    webPreferences: {
      preload:          path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
      webSecurity:      !isDev,
      backgroundThrottling: false,
      // Pass the chosen decoration mode to the preload/renderer synchronously
      additionalArguments: [`--wolly-deco=${windowDeco}`],
    },

    icon: path.join(__dirname, "../public/icon.png"),
  });

  // ── Load renderer ──────────────────────────────────────────────────────────
  if (DEV_URL) {
    mainWindow.loadURL(DEV_URL);
    if (process.env["ELECTRON_DEVTOOLS"] === "1") {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  } else {
    mainWindow.loadFile(path.join(DIST, "index.html"));
  }

  // ── Show window once fully painted ────────────────────────────────────────
  mainWindow.once("ready-to-show", () => {
    mainWindow!.show();
    mainWindow!.focus();
  });

  // Safety net: force show after 4 s (handles GPU-crash / SW-fallback startup)
  const showTimeout = setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.warn("[Wolly] ready-to-show timed out – forcing show()");
      mainWindow.show();
    }
  }, 4000);
  mainWindow.once("ready-to-show", () => clearTimeout(showTimeout));

  mainWindow.on("maximize",   () => mainWindow?.webContents.send("window:maximized"));
  mainWindow.on("unmaximize", () => mainWindow?.webContents.send("window:unmaximized"));
  mainWindow.on("closed",     () => { mainWindow = null; });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  nativeTheme.on("updated", () => {
    mainWindow?.webContents.send("native-theme-changed", nativeTheme.shouldUseDarkColors);
  });
}

// ─── IPC: window controls (used only in CSD mode) ────────────────────────────
function registerWindowHandlers() {
  ipcMain.on("window:minimize",  () => mainWindow?.minimize());
  ipcMain.on("window:maximize",  () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.on("window:close",     () => mainWindow?.close());
  ipcMain.handle("window:is-maximized", () => mainWindow?.isMaximized() ?? false);
}

// ─── Native app menu ─────────────────────────────────────────────────────────
function buildMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Wolly",
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "hide" }, { role: "hideOthers" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" }, { role: "redo" },
        { type: "separator" },
        { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" }, { role: "forceReload" },
        ...(isDev ? [{ role: "toggleDevTools" as const }] : []),
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
  ];

  Menu.setApplicationMenu(
    process.platform === "darwin" ? Menu.buildFromTemplate(template) : null
  );
}

// ─── App lifecycle ───────────────────────────────────────────────────────────
app.whenReady().then(() => {
  buildMenu();
  registerWindowHandlers();
  registerSystemHandlers();
  registerWallpaperHandlers();
  registerDesktopHandlers();
  registerAppSettingsHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Single-instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
