import { ipcMain, app, shell } from "electron";
import { exec }   from "node:child_process";
import { promisify } from "node:util";
import fs   from "node:fs";
import os   from "node:os";
import path from "node:path";

const execAsync = promisify(exec);

// ─── XDG paths ───────────────────────────────────────────────────────────────

function xdgAppsDir():  string { return path.join(os.homedir(), ".local", "share", "applications"); }
function xdgIconsDir(): string { return path.join(os.homedir(), ".local", "share", "icons", "hicolor"); }
function desktopFile(): string { return path.join(xdgAppsDir(), "wolly.desktop"); }
function scalableIcon():string { return path.join(xdgIconsDir(), "scalable", "apps", "wolly.svg"); }
function png256Icon():  string { return path.join(xdgIconsDir(), "256x256",  "apps", "wolly.png"); }

// ─── Status ──────────────────────────────────────────────────────────────────

export interface DesktopStatus {
  installed:   boolean;
  desktopPath: string;
  iconPath:    string;
  execPath:    string;
  isDev:       boolean;
}

function getStatus(): DesktopStatus {
  const isDev = !app.isPackaged;
  return {
    installed:   fs.existsSync(desktopFile()),
    desktopPath: desktopFile(),
    iconPath:    scalableIcon(),
    execPath:    app.getPath("exe"),
    isDev,
  };
}

// ─── SVG icon — minimal monitor/screen on deep violet background ───────────────
//   Mirrors WollyIcon.tsx exactly but self-contained (no React / JSX needed).

function buildIconSvg(): string {
  const r = Math.round(512 * 0.224); // Apple-style corner radius ≈ 114.7

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" fill="none"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="clip"><rect width="512" height="512" rx="${r}" ry="${r}"/></clipPath>

    <!-- Background -->
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#130828"/>
      <stop offset="100%" stop-color="#0a0318"/>
    </linearGradient>
    <radialGradient id="bglow" cx="50%" cy="48%" r="50%">
      <stop offset="0%"   stop-color="#6d28d9" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#6d28d9" stop-opacity="0"/>
    </radialGradient>

    <!-- Monitor bezel -->
    <linearGradient id="bezel" x1="256" y1="80" x2="256" y2="340" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#2a1558"/>
      <stop offset="100%" stop-color="#1a0d3e"/>
    </linearGradient>

    <!-- Screen display area -->
    <linearGradient id="screen" x1="256" y1="104" x2="256" y2="316" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#0e0730"/>
      <stop offset="60%"  stop-color="#0a0525"/>
      <stop offset="100%" stop-color="#07031a"/>
    </linearGradient>
    <radialGradient id="wallglow" cx="50%" cy="42%" r="55%">
      <stop offset="0%"   stop-color="#7c3aed" stop-opacity="0.28"/>
      <stop offset="60%"  stop-color="#4f46e5" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="horizon" x1="96" y1="0" x2="416" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#a78bfa" stop-opacity="0"/>
      <stop offset="30%"  stop-color="#a78bfa" stop-opacity="0.55"/>
      <stop offset="70%"  stop-color="#818cf8" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#818cf8" stop-opacity="0"/>
    </linearGradient>

    <!-- Stand / base -->
    <linearGradient id="stand" x1="256" y1="334" x2="256" y2="420" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#22114a"/>
      <stop offset="100%" stop-color="#16093a"/>
    </linearGradient>

    <!-- Top-edge sheen -->
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="40%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <!-- Bezel glow filter -->
    <filter id="glow" x="-6%" y="-6%" width="112%" height="112%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur"/>
      <feFlood flood-color="#7c3aed" flood-opacity="0.5" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="halo"/>
      <feMerge>
        <feMergeNode in="halo"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <g clip-path="url(#clip)">
    <!-- Background -->
    <rect width="512" height="512" fill="url(#bg)"/>
    <rect width="512" height="512" fill="url(#bglow)"/>

    <!-- Monitor bezel -->
    <rect x="72" y="88" width="368" height="244" rx="20" ry="20"
          fill="url(#bezel)" filter="url(#glow)"/>
    <rect x="72" y="88" width="368" height="244" rx="20" ry="20"
          fill="none" stroke="rgba(167,139,250,0.30)" stroke-width="1.5"/>

    <!-- Screen display area -->
    <rect x="96" y="110" width="320" height="200" rx="8" ry="8"
          fill="url(#screen)"/>
    <rect x="96" y="110" width="320" height="200" rx="8" ry="8"
          fill="url(#wallglow)"/>

    <!-- Horizon line -->
    <rect x="96" y="234" width="320" height="2" rx="1"
          fill="url(#horizon)" opacity="0.9"/>

    <!-- Mountain silhouette inside screen -->
    <path d="M 96 310 L 148 258 L 186 282 L 230 240 L 256 260 L 282 240 L 326 282 L 364 258 L 416 310 Z"
          fill="rgba(167,139,250,0.09)"/>

    <!-- Screen top sheen -->
    <rect x="96" y="110" width="320" height="60"
          fill="rgba(255,255,255,0.025)"/>

    <!-- Screen inner border -->
    <rect x="96" y="110" width="320" height="200" rx="8" ry="8"
          fill="none" stroke="rgba(167,139,250,0.15)" stroke-width="1"/>

    <!-- Stand neck -->
    <rect x="238" y="332" width="36" height="54"
          fill="url(#stand)"/>

    <!-- Base -->
    <rect x="154" y="384" width="204" height="22" rx="11" ry="11"
          fill="url(#stand)"/>
    <rect x="154" y="384" width="204" height="4" rx="2" ry="2"
          fill="rgba(167,139,250,0.12)"/>

    <!-- Icon sheen -->
    <rect width="512" height="512" fill="url(#sheen)"/>
  </g>
</svg>`;
}

// ─── Generate .desktop file content ──────────────────────────────────────────

function buildDesktopFile(execPath: string, iconPath: string, isDev: boolean): string {
  // On Wayland, pass the ozone hint so the app launches as a real Wayland client
  const waylandArgs = "--ozone-platform-hint=auto --enable-features=WaylandWindowDecorations";

  // In dev mode the exec is the raw `electron` binary — add the app path
  const execLine = isDev
    ? `${execPath} ${app.getAppPath()} ${waylandArgs} %U`
    : `${execPath} ${waylandArgs} %U`;

  return `[Desktop Entry]
Version=1.0
Type=Application
Name=Wolly
GenericName=Wallpaper Browser
Comment=Browse and apply beautiful wallpapers from wallhaven.cc
Exec=${execLine}
Icon=${iconPath}
Terminal=false
Categories=Utility;Graphics;Photography;
Keywords=wallpaper;background;wallhaven;wolly;desktop;image;browser;
StartupWMClass=wolly
StartupNotify=true
X-KDE-StartupNotify=true
`;
}

// ─── Install ──────────────────────────────────────────────────────────────────

async function install(): Promise<{ success: boolean; error?: string; desktopPath: string; iconPath: string }> {
  const dp = desktopFile();
  const ip = scalableIcon();

  try {
    // 1. Create dirs
    fs.mkdirSync(xdgAppsDir(), { recursive: true });
    fs.mkdirSync(path.dirname(ip), { recursive: true });

    // 2. Write SVG icon
    fs.writeFileSync(ip, buildIconSvg(), "utf8");
    fs.chmodSync(ip, 0o644);

    // 3. Also write to 256x256 apps dir (some launchers prefer raster entries)
    //    We write the same SVG there — better than nothing, and many launchers
    //    will fall back to scalable anyway.
    const p256 = png256Icon().replace(/\.png$/, ".svg");
    fs.mkdirSync(path.dirname(p256), { recursive: true });
    fs.copyFileSync(ip, p256);

    // 4. Write .desktop file (using scalable SVG path as Icon value)
    const isDev    = !app.isPackaged;
    const execPath = app.getPath("exe");
    const content  = buildDesktopFile(execPath, ip, isDev);
    fs.writeFileSync(dp, content, "utf8");
    fs.chmodSync(dp, 0o644);

    // 5. Update desktop & icon databases (best-effort — may not be installed)
    await execAsync(`update-desktop-database "${xdgAppsDir()}" 2>/dev/null || true`);
    await execAsync(`gtk-update-icon-cache -f -t "${xdgIconsDir()}" 2>/dev/null || true`);
    // KDE-specific
    await execAsync(`kbuildsycoca6 --noincremental 2>/dev/null || kbuildsycoca5 --noincremental 2>/dev/null || true`);

    return { success: true, desktopPath: dp, iconPath: ip };
  } catch (e) {
    return { success: false, error: String(e), desktopPath: dp, iconPath: ip };
  }
}

// ─── Uninstall ────────────────────────────────────────────────────────────────

async function uninstall(): Promise<{ success: boolean; error?: string }> {
  try {
    const dp   = desktopFile();
    const ip   = scalableIcon();
    const p256 = png256Icon().replace(/\.png$/, ".svg");

    if (fs.existsSync(dp))   fs.unlinkSync(dp);
    if (fs.existsSync(ip))   fs.unlinkSync(ip);
    if (fs.existsSync(p256)) fs.unlinkSync(p256);

    await execAsync(`update-desktop-database "${xdgAppsDir()}" 2>/dev/null || true`);
    await execAsync(`gtk-update-icon-cache -f -t "${xdgIconsDir()}" 2>/dev/null || true`);
    await execAsync(`kbuildsycoca6 --noincremental 2>/dev/null || kbuildsycoca5 --noincremental 2>/dev/null || true`);

    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Register handlers ────────────────────────────────────────────────────────

export function registerDesktopHandlers() {
  ipcMain.handle("desktop:status",    () => getStatus());
  ipcMain.handle("desktop:install",   () => install());
  ipcMain.handle("desktop:uninstall", () => uninstall());

  ipcMain.handle("desktop:open-location", async () => {
    const dir = xdgAppsDir();
    fs.mkdirSync(dir, { recursive: true });
    await shell.openPath(dir);
    return { success: true };
  });
}