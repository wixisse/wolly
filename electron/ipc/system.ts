import { ipcMain } from "electron";
import { execSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

// ─── Types ──────────────────────────────────────────────────────────────────

export type LinuxDE = "gnome" | "kde6" | "kde5" | "hyprland" | "sway" | "xfce" | "other";
export type DisplayServer = "wayland" | "x11" | "unknown";

export interface SystemInfo {
  platform:      "linux" | "darwin" | "win32" | "unknown";
  displayServer: DisplayServer;
  desktopEnv:    LinuxDE;
  homeDir:       string;
  wallpaperDir:  string;
  hostname:      string;
  arch:          string;
  release:       string;
}

// ─── Detect Linux desktop environment ───────────────────────────────────────

function detectLinuxDE(): LinuxDE {
  const desktop = (process.env.XDG_CURRENT_DESKTOP ?? "").toLowerCase();
  const session = (process.env.DESKTOP_SESSION ?? "").toLowerCase();
  const xdgDesk = (process.env.XDG_SESSION_DESKTOP ?? "").toLowerCase();

  if (desktop.includes("hyprland") || xdgDesk.includes("hyprland")) return "hyprland";
  if (desktop.includes("sway")     || xdgDesk.includes("sway") || session.includes("sway")) return "sway";

  if (
    desktop.includes("kde") || desktop.includes("plasma") ||
    session.includes("plasma") || xdgDesk.includes("kde")
  ) {
    try {
      const ver = execSync("plasmashell --version 2>/dev/null", { timeout: 2500 }).toString();
      return /\b6\./.test(ver) ? "kde6" : "kde5";
    } catch {
      return "kde6"; // assume latest if can't detect
    }
  }

  if (
    desktop.includes("gnome") || desktop.includes("unity") ||
    desktop.includes("ubuntu") || session.includes("gnome")
  ) return "gnome";

  if (desktop.includes("xfce") || session.includes("xfce")) return "xfce";
  if (desktop.includes("lxde") || desktop.includes("lxqt")) return "other";

  return "other";
}

// ─── Detect display server ──────────────────────────────────────────────────

function detectDisplayServer(): DisplayServer {
  if (process.env.WAYLAND_DISPLAY)              return "wayland";
  if (process.env.XDG_SESSION_TYPE === "wayland") return "wayland";
  if (process.env.DISPLAY)                       return "x11";
  return "unknown";
}

// ─── Build full system info ──────────────────────────────────────────────────

function getSystemInfo(): SystemInfo {
  const plat = process.platform;
  const homeDir = os.homedir();

  let wallpaperDir: string;
  if (plat === "win32") {
    wallpaperDir = path.join(homeDir, "Pictures", "wall");
  } else if (plat === "darwin") {
    wallpaperDir = path.join(homeDir, "Pictures", "wall");
  } else {
    wallpaperDir = path.join(homeDir, "Pictures", "wall");
  }

  const platform =
    plat === "linux"  ? "linux"  :
    plat === "darwin" ? "darwin" :
    plat === "win32"  ? "win32"  : "unknown";

  return {
    platform,
    displayServer: plat === "linux" ? detectDisplayServer() : "unknown",
    desktopEnv:    plat === "linux" ? detectLinuxDE()       : "other",
    homeDir,
    wallpaperDir,
    hostname: os.hostname(),
    arch:     os.arch(),
    release:  os.release(),
  };
}

// ─── Register handlers ───────────────────────────────────────────────────────

export function registerSystemHandlers() {
  ipcMain.handle("system:info", () => {
    try {
      return { success: true, data: getSystemInfo() };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });
}
