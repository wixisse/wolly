import { ipcMain } from "electron";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import https from "node:https";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import type { LinuxDE, DisplayServer } from "./system";

const execAsync = promisify(exec);

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ApplyOptions {
  linuxDE?:      LinuxDE;
  displayServer?: DisplayServer;
}

interface ProgressEvent {
  stage:    "downloading" | "applying" | "done" | "error";
  progress?: number; // 0-100
  message?:  string;
}

// ─── Download ────────────────────────────────────────────────────────────────

function downloadFile(
  url: string,
  dest: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const file  = fs.createWriteStream(dest);

    const req = proto.get(url, (res) => {
      // Follow redirects (301/302)
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        downloadFile(res.headers.location, dest, onProgress).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const total = parseInt(res.headers["content-length"] ?? "0", 10);
      let received = 0;

      res.on("data", (chunk: Buffer) => {
        received += chunk.length;
        if (total && onProgress) onProgress(Math.round((received / total) * 100));
      });

      res.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
    });

    req.on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });

    file.on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// ─── Apply: GNOME (Wayland & X11) ────────────────────────────────────────────

async function applyGNOME(filePath: string) {
  const uri = `file://${filePath}`;
  // Desktop
  await execAsync(`gsettings set org.gnome.desktop.background picture-uri       "${uri}"`);
  await execAsync(`gsettings set org.gnome.desktop.background picture-uri-dark  "${uri}"`);
  await execAsync(`gsettings set org.gnome.desktop.background picture-options   "zoom"`);
  // Lock screen
  await execAsync(`gsettings set org.gnome.desktop.screensaver picture-uri      "${uri}"`);
  await execAsync(`gsettings set org.gnome.desktop.screensaver picture-options  "zoom"`);
}

// ─── Apply: KDE Plasma 6 ─────────────────────────────────────────────────────

/**
 * KDE 6 lock-screen fallback chain
 *
 * We try three methods because plasma-apply-wallpaperimage --lockscreen was
 * only added in Plasma 6.0 and is absent on some distro builds:
 *
 *   A. plasma-apply-wallpaperimage --lockscreen  (official, Plasma 6.0+)
 *   B. kwriteconfig6                             (direct config write, always works)
 *   C. kwriteconfig5                             (Plasma-5 tools present on some Plasma-6 systems)
 */
async function applyKDE6LockScreen(filePath: string): Promise<void> {
  // A — official flag
  try {
    await execAsync(`plasma-apply-wallpaperimage --lockscreen "${filePath}"`);
    return;
  } catch { /* not supported on this Plasma version */ }

  // B — kwriteconfig6 + reload signal
  try {
    await execAsync(
      `kwriteconfig6 --file kscreenlockerrc` +
      ` --group Greeter --group Wallpaper --group org.kde.image --group General` +
      ` --key Image "file://${filePath}"`
    );
    // Tell KWin to re-read its config (best-effort — may not be running)
    await execAsync(
      `qdbus6 org.kde.KWin /KWin reconfigure 2>/dev/null ||` +
      ` qdbus  org.kde.KWin /KWin reconfigure 2>/dev/null || true`
    );
    return;
  } catch { /* kwriteconfig6 not available */ }

  // C — kwriteconfig5 (Plasma-5 tools still present on many Plasma-6 installs)
  try {
    await execAsync(
      `kwriteconfig5 --file kscreenlockerrc` +
      ` --group Greeter --group Wallpaper --group org.kde.image --group General` +
      ` --key Image "file://${filePath}"`
    );
  } catch (e) {
    // Non-fatal: desktop wallpaper was already set; log and continue
    console.warn("[Wolly] KDE lock screen: all methods exhausted –", String(e));
  }
}

async function applyKDE6(filePath: string) {
  // Desktop (all screens via official tool)
  await execAsync(`plasma-apply-wallpaperimage "${filePath}"`);
  // Lock screen — independent, non-fatal fallback chain
  await applyKDE6LockScreen(filePath);
}

// ─── Apply: KDE Plasma 5 ─────────────────────────────────────────────────────

async function applyKDE5(filePath: string) {
  // Desktop via qdbus + JavaScript eval
  const dbusScript = [
    `var allDesktops = desktops();`,
    `for (var i = 0; i < allDesktops.length; i++) {`,
    `  var d = allDesktops[i];`,
    `  d.wallpaperPlugin = 'org.kde.image';`,
    `  d.currentConfigGroup = ['Wallpaper', 'org.kde.image', 'General'];`,
    `  d.writeConfig('Image', 'file://${filePath}');`,
    `  d.writeConfig('FillMode', 6);`,
    `}`,
  ].join(" ");

  await execAsync(
    `qdbus org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript '${dbusScript}'`
  );

  // Lock screen — write config, then signal the greeter to reload
  try {
    await execAsync(
      `kwriteconfig5 --file kscreenlockerrc` +
      ` --group Greeter --group Wallpaper --group org.kde.image --group General` +
      ` --key Image "file://${filePath}"`
    );
    // kscreenlocker_greet only runs while the screen is locked; killing it
    // forces a respawn which picks up the new config.  If it's not running
    // this is silently ignored via "|| true".
    await execAsync(`kquitapp5 kscreenlocker_greet 2>/dev/null || true`);
  } catch (e) {
    console.warn("[Wolly] KDE5 lock screen config write failed:", String(e));
  }
}

// ─── Apply: Hyprland (Wayland) ───────────────────────────────────────────────

async function applyHyprland(filePath: string) {
  try {
    // Prefer swww (animated transitions)
    await execAsync(`swww query 2>/dev/null || swww init`);
    await execAsync(
      `swww img "${filePath}" ` +
      `--transition-type wipe --transition-angle 45 --transition-duration 1.5`
    );
  } catch {
    // Fallback: hyprpaper
    const confDir  = path.join(os.homedir(), ".config", "hypr");
    const confFile = path.join(confDir, "hyprpaper.conf");
    fs.mkdirSync(confDir, { recursive: true });
    fs.writeFileSync(confFile, `preload = ${filePath}\nwallpaper = ,${filePath}\n`);
    await execAsync(`pkill hyprpaper 2>/dev/null || true; sleep 0.2; hyprpaper &`);
  }
}

// ─── Apply: Sway (Wayland) ───────────────────────────────────────────────────

async function applySway(filePath: string) {
  await execAsync(`pkill swaybg 2>/dev/null || true`);
  await execAsync(`swaybg -m fill -i "${filePath}" &`);
}

// ─── Apply: XFCE / feh (X11) ────────────────────────────────────────────────

async function applyXFCE(filePath: string) {
  try {
    // Try xfconf-query first (XFCE native)
    const monOutput = await execAsync(
      `xfconf-query -c xfce4-desktop -l 2>/dev/null | grep last-image | sed 's|/last-image||'`
    );
    const monitors = monOutput.stdout.trim().split("\n").filter(Boolean);
    for (const mon of monitors) {
      await execAsync(`xfconf-query -c xfce4-desktop -p "${mon}/last-image" -s "${filePath}"`);
      await execAsync(`xfconf-query -c xfce4-desktop -p "${mon}/image-style" -s 5`);
    }
    await execAsync(`xfdesktop --reload 2>/dev/null || true`);
  } catch {
    // Fallback: feh
    await execAsync(`feh --bg-fill "${filePath}"`);
    const fehbg = path.join(os.homedir(), ".fehbg");
    fs.writeFileSync(fehbg, `#!/bin/sh\nfeh --bg-fill '${filePath}'\n`);
    fs.chmodSync(fehbg, 0o755);
  }
}

// ─── Apply: macOS ────────────────────────────────────────────────────────────

async function applyMacOS(filePath: string) {
  const script = [
    `tell application "System Events"`,
    `  set wp to POSIX file "${filePath}"`,
    `  tell every desktop`,
    `    set picture to wp`,
    `  end tell`,
    `end tell`,
  ].join("\n");
  await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
}

// ─── Apply: Windows ──────────────────────────────────────────────────────────

async function applyWindows(filePath: string) {
  const escaped = filePath.replace(/\\/g, "\\\\").replace(/'/g, "''");
  const ps = `
Add-Type -TypeDefinition @"
using System.Runtime.InteropServices;
public class WallpaperSetter {
  [DllImport("user32.dll", CharSet = CharSet.Auto)]
  public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);
}
"@
[WallpaperSetter]::SystemParametersInfo(20, 0, '${escaped}', 3)
`.trim();
  await execAsync(`powershell -NonInteractive -NoProfile -Command "${ps.replace(/"/g, '\\"')}"`);
}

// ─── Master apply dispatcher ─────────────────────────────────────────────────

async function applyWallpaper(filePath: string, opts: ApplyOptions): Promise<void> {
  const platform = process.platform;

  if (platform === "darwin") {
    await applyMacOS(filePath);
    return;
  }

  if (platform === "win32") {
    await applyWindows(filePath);
    return;
  }

  // Linux — dispatch by DE
  const de = opts.linuxDE ?? "gnome";
  switch (de) {
    case "gnome":    await applyGNOME(filePath);    break;
    case "kde6":     await applyKDE6(filePath);     break;
    case "kde5":     await applyKDE5(filePath);     break;
    case "hyprland": await applyHyprland(filePath); break;
    case "sway":     await applySway(filePath);     break;
    default:         await applyXFCE(filePath);     break;
  }
}

// ─── Register IPC handlers ───────────────────────────────────────────────────

export function registerWallpaperHandlers() {
  // ── Download only ──────────────────────────────────────────────────────────
  ipcMain.handle("wallpaper:download", async (event, url: string, id: string) => {
    try {
      const wallDir = path.join(os.homedir(), "Pictures", "wall");
      fs.mkdirSync(wallDir, { recursive: true });

      const ext      = path.extname(new URL(url).pathname) || ".jpg";
      const filePath = path.join(wallDir, `wolly-${id}${ext}`);

      await downloadFile(url, filePath, (pct) => {
        event.sender.send("wallpaper:progress", {
          stage: "downloading",
          progress: pct,
          message: `Downloading… ${pct}%`,
        } as ProgressEvent);
      });

      event.sender.send("wallpaper:progress", {
        stage: "done",
        progress: 100,
        message: `Saved to ${filePath}`,
      } as ProgressEvent);

      return { success: true, path: filePath };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  // ── Download + Apply ───────────────────────────────────────────────────────
  ipcMain.handle(
    "wallpaper:download-and-apply",
    async (event, url: string, id: string, opts: ApplyOptions) => {
      try {
        // 1. Download
        const wallDir = path.join(os.homedir(), "Pictures", "wall");
        fs.mkdirSync(wallDir, { recursive: true });

        const ext      = path.extname(new URL(url).pathname) || ".jpg";
        const filePath = path.join(wallDir, `wolly-${id}${ext}`);

        event.sender.send("wallpaper:progress", {
          stage: "downloading", progress: 0, message: "Downloading wallpaper…",
        } as ProgressEvent);

        await downloadFile(url, filePath, (pct) => {
          event.sender.send("wallpaper:progress", {
            stage: "downloading", progress: pct, message: `Downloading… ${pct}%`,
          } as ProgressEvent);
        });

        // 2. Apply
        event.sender.send("wallpaper:progress", {
          stage: "applying", progress: 95, message: "Applying wallpaper…",
        } as ProgressEvent);

        await applyWallpaper(filePath, opts);

        // 3. Done
        event.sender.send("wallpaper:progress", {
          stage: "done", progress: 100, message: `Applied: ${path.basename(filePath)}`,
        } as ProgressEvent);

        return { success: true, path: filePath };
      } catch (e) {
        event.sender.send("wallpaper:progress", {
          stage: "error", message: String(e),
        } as ProgressEvent);
        return { success: false, error: String(e) };
      }
    }
  );

  // ── Apply existing file ────────────────────────────────────────────────────
  ipcMain.handle("wallpaper:apply", async (_event, filePath: string, opts: ApplyOptions) => {
    try {
      await applyWallpaper(filePath, opts);
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });
}