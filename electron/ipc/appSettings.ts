import { app, ipcMain } from "electron";
import fs   from "node:fs";
import path from "node:path";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AppSettings {
  /** "server" = WM/compositor draws decorations (native title bar)
   *  "client" = Electron draws its own frameless TitleBar component */
  windowDecorations: "server" | "client";
}

const DEFAULTS: AppSettings = { windowDecorations: "server" };

// ─── Path helpers ─────────────────────────────────────────────────────────────
//
// We deliberately compute the path without app.getPath() so this can be called
// synchronously at module-load time (before app.whenReady()), which is needed
// to set command-line switches before the GPU process starts.

function settingsDir(): string {
  const home = process.env["HOME"] || process.env["USERPROFILE"] || "/tmp";
  if (process.platform === "win32") {
    return path.join(process.env["APPDATA"] || path.join(home, "AppData", "Roaming"), "Wolly");
  }
  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Wolly");
  }
  // Linux — honour XDG_CONFIG_HOME
  const xdg = process.env["XDG_CONFIG_HOME"] || path.join(home, ".config");
  return path.join(xdg, "Wolly");
}

export function settingsFilePath(): string {
  return path.join(settingsDir(), "settings.json");
}

// ─── Read / Write ─────────────────────────────────────────────────────────────

/** Synchronous – safe to call before app.whenReady(). */
export function readAppSettings(): AppSettings {
  try {
    const raw  = fs.readFileSync(settingsFilePath(), "utf-8");
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      windowDecorations:
        parsed.windowDecorations === "client" ? "client" : "server",
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeAppSettings(s: AppSettings): void {
  const dir = settingsDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(settingsFilePath(), JSON.stringify(s, null, 2), "utf-8");
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────

export function registerAppSettingsHandlers(): void {
  ipcMain.handle("appSettings:get", () => readAppSettings());

  ipcMain.handle("appSettings:set", (_e, patch: Partial<AppSettings>) => {
    try {
      const cur = readAppSettings();
      writeAppSettings({ ...cur, ...patch });
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  // Graceful relaunch — called after the renderer has persisted the new setting.
  ipcMain.handle("appSettings:relaunch", () => {
    app.relaunch();
    app.exit(0);
  });
}
