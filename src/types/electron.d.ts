// ─── Types shared between main and renderer ──────────────────────────────────

export interface SystemInfo {
  platform:      "linux" | "darwin" | "win32" | "unknown";
  displayServer: "wayland" | "x11" | "unknown";
  desktopEnv:    "gnome" | "kde6" | "kde5" | "hyprland" | "sway" | "xfce" | "other";
  homeDir:       string;
  wallpaperDir:  string;
  hostname:      string;
  arch:          string;
  release:       string;
}

export interface ApplyOptions {
  linuxDE?:       SystemInfo["desktopEnv"];
  displayServer?: SystemInfo["displayServer"];
}

export type WallpaperProgress = {
  stage:    "downloading" | "applying" | "done" | "error";
  progress?: number;
  message?:  string;
};

export interface DesktopStatus {
  installed:   boolean;
  desktopPath: string;
  iconPath:    string;
  execPath:    string;
  isDev:       boolean;
}

export interface AppSettings {
  windowDecorations: "server" | "client";
}

// ─── Global window.electronAPI ───────────────────────────────────────────────

declare global {
  interface Window {
    electronAPI?: {
      /** Set at preload time from process.platform */
      platform: "linux" | "darwin" | "win32";

      /** Window decoration mode: "server" = native OS frame, "client" = custom TitleBar */
      windowDeco: "server" | "client";

      /** Full system information from the main process */
      getSystemInfo: () => Promise<{ success: boolean; data?: SystemInfo; error?: string }>;

      /** Download wallpaper to ~/Pictures/wall/<id>.jpg */
      downloadWallpaper: (
        url: string,
        id:  string
      ) => Promise<{ success: boolean; path?: string; error?: string }>;

      /** Apply a file that already exists on disk */
      applyWallpaper: (
        filePath: string,
        opts:     ApplyOptions
      ) => Promise<{ success: boolean; error?: string }>;

      /** Download + apply in one shot (recommended) */
      downloadAndApply: (
        url:  string,
        id:   string,
        opts: ApplyOptions
      ) => Promise<{ success: boolean; path?: string; error?: string }>;

      /** Subscribe to download/apply progress events */
      onProgress:             (handler: ProgressHandler) => void;
      removeProgressListener: () => void;

      // Window controls (used when windowDeco === "client")
      windowMinimize:    () => void;
      windowMaximize:    () => void;
      windowClose:       () => void;
      windowIsMaximized: () => Promise<boolean>;
      onMaximizeChange:  (cb: (maximized: boolean) => void) => () => void;

      // App settings
      appSettingsGet:      () => Promise<AppSettings>;
      appSettingsSet:      (patch: Partial<AppSettings>) => Promise<{ success: boolean; error?: string }>;
      appSettingsRelaunch: () => Promise<void>;

      // Desktop integration (Linux only)
      desktopStatus:       () => Promise<DesktopStatus>;
      desktopInstall:      () => Promise<{ success: boolean; error?: string; desktopPath: string; iconPath: string }>;
      desktopUninstall:    () => Promise<{ success: boolean; error?: string }>;
      desktopOpenLocation: () => Promise<{ success: boolean }>;
    };
  }
}
