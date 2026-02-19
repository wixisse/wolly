// ─── Types ─────────────────────────────────────────────────────────────────

export type DetectedOS = "windows" | "macos" | "linux" | "unknown";
export type LinuxDE    = "gnome" | "kde6" | "kde5" | "hyprland" | "sway" | "xfce" | "other";
export type DisplayServer = "wayland" | "x11";

// ─── OS detection (browser UA) ─────────────────────────────────────────────

export function detectOS(): DetectedOS {
  const ua  = navigator.userAgent.toLowerCase();
  const plat = (navigator.platform ?? "").toLowerCase();

  if (plat.includes("win") || ua.includes("windows"))            return "windows";
  if (plat.includes("mac") || ua.includes("macintosh"))          return "macos";
  if (plat.includes("linux") || ua.includes("linux") ||
      ua.includes("x11")     || ua.includes("wayland"))          return "linux";
  return "unknown";
}

// ─── Guess display server (heuristic from UA) ──────────────────────────────

export function guessDisplayServer(): DisplayServer {
  const ua = navigator.userAgent.toLowerCase();
  // Firefox under Wayland exposes "wayland" in UA
  if (ua.includes("wayland")) return "wayland";
  // Modern Linux systems default to Wayland — lean that way
  if (ua.includes("linux")) return "wayland";
  return "x11";
}

// ─── Labels ────────────────────────────────────────────────────────────────

export const OS_LABELS: Record<DetectedOS, string> = {
  windows: "Windows",
  macos:   "macOS",
  linux:   "Linux",
  unknown: "Unknown",
};

export const DE_LABELS: Record<LinuxDE, string> = {
  gnome:    "GNOME",
  kde6:     "KDE Plasma 6",
  kde5:     "KDE Plasma 5",
  hyprland: "Hyprland",
  sway:     "Sway",
  xfce:     "XFCE / feh",
  other:    "Other / WM",
};

export const DE_DESCRIPTIONS: Record<LinuxDE, string> = {
  gnome:    "Uses gsettings — sets desktop & lock screen",
  kde6:     "Uses plasma-apply-wallpaperimage — sets desktop & lock screen",
  kde5:     "Uses qdbus & kwriteconfig5 — sets desktop & lock screen",
  hyprland: "Uses swww or hyprpaper — Wayland compositor",
  sway:     "Uses swaybg — Wayland compositor",
  xfce:     "Uses xfconf-query or feh",
  other:    "Uses feh (X11) or swaybg (Wayland)",
};
