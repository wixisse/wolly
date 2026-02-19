import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Download,
  Copy,
  Check,
  Terminal,
  Monitor,
  Layers,
  AlertCircle,
  ChevronRight,
  Zap,
  FolderOpen,
  FileCode2,
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Wallpaper } from "../types";
import {
  detectOS,
  guessDisplayServer,
  DetectedOS,
  LinuxDE,
  DisplayServer,
  OS_LABELS,
  DE_LABELS,
  DE_DESCRIPTIONS,
} from "../utils/osDetect";
import { generateScript, downloadScript } from "../utils/wallpaperScript";
import type { SystemInfo } from "../../types/electron";

interface ApplyModalProps {
  wallpaper: Wallpaper;
  onClose: () => void;
  onApplied: (id: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const OS_ICONS: Record<DetectedOS, React.ReactNode> = {
  linux: <Terminal size={14} />,
  macos: <Monitor size={14} />,
  windows: <Layers size={14} />,
  unknown: <Monitor size={14} />,
};
const OS_COLORS: Record<DetectedOS, string> = {
  linux: "#f7c948",
  macos: "#9ca3af",
  windows: "#60a5fa",
  unknown: "#9ca3af",
};

const LINUX_DES: { id: LinuxDE; wayland: boolean; x11: boolean }[] = [
  { id: "gnome", wayland: true, x11: true },
  { id: "kde6", wayland: true, x11: true },
  { id: "kde5", wayland: true, x11: true },
  { id: "hyprland", wayland: true, x11: false },
  { id: "sway", wayland: true, x11: false },
  { id: "xfce", wayland: false, x11: true },
  { id: "other", wayland: true, x11: true },
];

function highlightScript(code: string, lang: "bash" | "powershell"): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escape(code)
    .split("\n")
    .map((line) => {
      if (line.trimStart().startsWith("#")) {
        return `<span style="color:#6b7280;font-style:italic">${line}</span>`;
      }
      line = line.replace(
        /(["'])(.*?)\1/g,
        (_, q, c) => `<span style="color:#86efac">${q}${c}${q}</span>`,
      );
      const kws =
        lang === "powershell"
          ? [
              "Write-Host",
              "New-Item",
              "Invoke-WebRequest",
              "Add-Type",
              "Out-Null",
            ]
          : [
              "set",
              "if",
              "fi",
              "elif",
              "else",
              "for",
              "do",
              "done",
              "then",
              "echo",
              "mkdir",
              "wget",
              "curl",
              "command",
              "pkill",
              "sleep",
            ];
      kws.forEach((kw) => {
        const re = new RegExp(`\\b(${kw})\\b`, "g");
        line = line.replace(re, `<span style="color:#c4b5fd">$1</span>`);
      });
      line = line.replace(
        /(\$\{?[A-Z_][A-Z0-9_]*\}?)/g,
        `<span style="color:#93c5fd">$1</span>`,
      );
      return line;
    })
    .join("\n");
}

// ─── Progress bar component ───────────────────────────────────────────────────

function ProgressBar({
  stage,
  progress,
  message,
  error,
}: {
  stage: "idle" | "downloading" | "applying" | "done" | "error";
  progress: number;
  message: string;
  error?: string;
}) {
  const color =
    stage === "done" ? "#34d399" : stage === "error" ? "#f87171" : "#a78bfa";

  const Icon =
    stage === "done"
      ? CheckCircle2
      : stage === "error"
        ? XCircle
        : stage !== "idle"
          ? Loader2
          : null;

  return (
    <AnimatePresence>
      {stage !== "idle" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div
            className="rounded-xl p-4 space-y-3"
            style={{
              background:
                stage === "done"
                  ? "rgba(52,211,153,0.07)"
                  : stage === "error"
                    ? "rgba(248,113,113,0.07)"
                    : "rgba(124,58,237,0.08)",
              border: `1px solid ${color}30`,
            }}
          >
            {/* Status row */}
            <div className="flex items-center gap-2.5">
              {Icon && (
                <Icon
                  size={15}
                  style={{ color, flexShrink: 0 }}
                  className={
                    stage !== "done" && stage !== "error" ? "animate-spin" : ""
                  }
                />
              )}
              <span
                style={{
                  color: "var(--wh-text-1)",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {error || message}
              </span>
              {stage !== "done" && stage !== "error" && progress > 0 && (
                <span
                  className="ml-auto"
                  style={{ color: "var(--wh-text-3)", fontSize: "12px" }}
                >
                  {progress}%
                </span>
              )}
            </div>

            {/* Bar */}
            {(stage === "downloading" || stage === "applying") && (
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--wh-overlay-sm)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  initial={{ width: "0%" }}
                  animate={{
                    width:
                      stage === "applying"
                        ? "95%"
                        : `${Math.max(progress, 4)}%`,
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function ApplyModal({ wallpaper, onClose, onApplied }: ApplyModalProps) {
  const api = window.electronAPI;
  const isElectron = !!api;

  // ── State ──────────────────────────────────────────────────────────────────
  const [detectedOS, setDetectedOS] = useState<DetectedOS>("unknown");
  const [selectedOS, setSelectedOS] = useState<DetectedOS>("linux");
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [linuxDE, setLinuxDE] = useState<LinuxDE>("gnome");
  const [displayServer, setDisplayServer] = useState<DisplayServer>("wayland");

  // Progress (Electron native mode)
  const [applyStage, setApplyStage] = useState<
    "idle" | "downloading" | "applying" | "done" | "error"
  >("idle");
  const [applyPct, setApplyPct] = useState(0);
  const [applyMsg, setApplyMsg] = useState("");
  const [applyError, setApplyError] = useState("");

  // Script mode (web fallback)
  const [copied, setCopied] = useState(false);
  const [copiedScr, setCopiedScr] = useState(false);
  const [dlScript, setDlScript] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [scriptExpanded, setScriptExpanded] = useState(false);

  const hasApplied = applyStage === "done";
  const closedRef = useRef(false);

  // ── Boot: load system info ─────────────────────────────────────────────────
  useEffect(() => {
    if (isElectron && api) {
      api.getSystemInfo().then((res) => {
        if (res.success && res.data) {
          const info = res.data;
          setSystemInfo(info);
          setSelectedOS(
            info.platform === "unknown"
              ? "linux"
              : (info.platform as DetectedOS),
          );
          setDetectedOS(
            info.platform === "unknown"
              ? "linux"
              : (info.platform as DetectedOS),
          );
          setLinuxDE(info.desktopEnv as LinuxDE);
          setDisplayServer(
            info.displayServer === "unknown"
              ? "wayland"
              : (info.displayServer as DisplayServer),
          );
          // Store on window for TitleBar badge
          (window as any).__wallhavenDS = info.displayServer;
        }
      });
    } else {
      const os = detectOS();
      const ds = guessDisplayServer();
      setDetectedOS(os);
      setSelectedOS(os === "unknown" ? "linux" : os);
      setDisplayServer(ds);
    }
  }, [isElectron, api]);

  // ── Cleanup progress listener ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      api?.removeProgressListener();
      closedRef.current = true;
    };
  }, [api]);

  // ── Native Electron apply ──────────────────────────────────────────────────
  const handleNativeApply = useCallback(async () => {
    if (!api) return;
    setApplyStage("downloading");
    setApplyPct(0);
    setApplyMsg("Preparing download…");
    setApplyError("");

    api.onProgress((evt) => {
      if (closedRef.current) return;
      setApplyStage(evt.stage as typeof applyStage);
      setApplyPct(evt.progress ?? 0);
      setApplyMsg(evt.message ?? "");
      if (evt.stage === "error") setApplyError(evt.message ?? "Unknown error");
    });

    const result = await api.downloadAndApply(wallpaper.fullUrl, wallpaper.id, {
      linuxDE: linuxDE,
      displayServer: displayServer,
    });

    if (result.success) {
      setApplyStage("done");
      setApplyMsg(`Applied → ${result.path}`);
      onApplied(wallpaper.id);
    } else {
      setApplyStage("error");
      setApplyError(result.error ?? "Apply failed");
    }
  }, [api, wallpaper, linuxDE, displayServer, onApplied]);

  // ── Script mode helpers ────────────────────────────────────────────────────
  const script = generateScript({
    wallpaperUrl: wallpaper.fullUrl,
    wallpaperId: wallpaper.id,
    os: selectedOS,
    linuxDE,
    displayServer,
  });

  const handleDownloadImage = useCallback(() => {
    const a = document.createElement("a");
    a.href = wallpaper.fullUrl;
    a.download = `wallhaven-${wallpaper.id}.jpg`;
    a.target = "_blank";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloaded(true);
  }, [wallpaper]);

  const handleDownloadScript = useCallback(() => {
    downloadScript(script);
    setDlScript(true);
    setTimeout(() => setDlScript(false), 2500);
  }, [script]);
  const handleCopyScript = useCallback(async () => {
    await navigator.clipboard.writeText(script.code);
    setCopiedScr(true);
    setTimeout(() => setCopiedScr(false), 2000);
  }, [script]);
  const handleCopyPath = useCallback(async () => {
    await navigator.clipboard.writeText(script.wallFile);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [script]);

  // ── Styles ─────────────────────────────────────────────────────────────────
  const osColor = OS_COLORS[selectedOS];
  const sL: React.CSSProperties = {
    color: "var(--wh-text-4)",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
  };
  const pill = (active: boolean, accent: string): React.CSSProperties => ({
    background: active ? `${accent}22` : "var(--wh-overlay-xs)",
    border: `1px solid ${active ? `${accent}55` : "var(--wh-border)"}`,
    color: active ? accent : "var(--wh-text-3)",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s",
    fontSize: "12px",
    fontWeight: active ? 600 : 400,
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 16 }}
          transition={{ type: "spring", damping: 20, stiffness: 220 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{
            background: "var(--wh-surface-1)",
            border: "1px solid var(--wh-border-strong)",
            maxHeight: "90vh",
          }}
        >
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b shrink-0"
            style={{ borderColor: "var(--wh-border)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: `${osColor}22`,
                  border: `1px solid ${osColor}44`,
                }}
              >
                <span style={{ color: osColor }}>{OS_ICONS[selectedOS]}</span>
              </div>
              <div>
                <p
                  style={{
                    color: "var(--wh-text-1)",
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                >
                  Apply Wallpaper
                </p>
                <p style={{ color: "var(--wh-text-4)", fontSize: "11px" }}>
                  {wallpaper.resolution} · {wallpaper.fileSize}
                  {isElectron && systemInfo && (
                    <span style={{ marginLeft: 6, color: osColor }}>
                      · {OS_LABELS[detectedOS]}
                      {systemInfo.displayServer !== "unknown" && (
                        <span
                          style={{
                            color:
                              systemInfo.displayServer === "wayland"
                                ? "#a78bfa"
                                : "var(--wh-text-4)",
                          }}
                        >
                          {" "}
                          ({systemInfo.displayServer})
                        </span>
                      )}
                    </span>
                  )}
                </p>
              </div>
            </div>
            {/* Electron badge */}
            {isElectron && (
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(124,58,237,0.15)",
                  color: "#a78bfa",
                  border: "1px solid rgba(124,58,237,0.25)",
                }}
              >
                Native
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg ml-2"
              style={{ color: "var(--wh-text-3)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--wh-overlay-md)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* ── Scrollable body ─────────────────────────────────────────────── */}
          <div className="overflow-y-auto p-5 space-y-4 flex-1">
            {/* Thumb + path */}
            <div className="flex gap-3 items-center">
              <div className="w-20 h-12 rounded-lg overflow-hidden shrink-0">
                <img
                  src={wallpaper.thumbUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="mb-1" style={sL}>
                  Target Path
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 px-3 py-2 rounded-lg overflow-hidden"
                    style={{
                      background: "var(--wh-surface-2)",
                      border: "1px solid var(--wh-border)",
                      fontFamily: "monospace",
                      fontSize: "11px",
                      color: "var(--wh-text-2)",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <FolderOpen
                      size={11}
                      style={{
                        display: "inline",
                        marginRight: 6,
                        color: "var(--wh-text-4)",
                      }}
                    />
                    {script.wallFile}
                  </div>
                  <button
                    onClick={handleCopyPath}
                    className="p-2 rounded-lg shrink-0"
                    style={{
                      background: copied
                        ? "rgba(16,185,129,0.15)"
                        : "var(--wh-overlay-sm)",
                      color: copied ? "#34d399" : "var(--wh-text-3)",
                      border: "1px solid var(--wh-border)",
                    }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Electron native: OS/DE shown as read-only ────────────────── */}
            {isElectron && systemInfo ? (
              <div
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: "var(--wh-overlay-xs)",
                  border: "1px solid var(--wh-border)",
                }}
              >
                <p style={sL}>Detected Environment</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "OS", value: OS_LABELS[detectedOS] },
                    {
                      label: "Session",
                      value: systemInfo.displayServer.toUpperCase(),
                    },
                    {
                      label: "Desktop",
                      value:
                        DE_LABELS[systemInfo.desktopEnv as LinuxDE] ??
                        systemInfo.desktopEnv,
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="px-3 py-2.5 rounded-xl text-center"
                      style={{
                        background: "var(--wh-overlay-sm)",
                        border: "1px solid var(--wh-border)",
                      }}
                    >
                      <p
                        style={{
                          color: "var(--wh-text-4)",
                          fontSize: "10px",
                          marginBottom: 2,
                        }}
                      >
                        {row.label}
                      </p>
                      <p
                        style={{
                          color: "var(--wh-text-1)",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
                {(systemInfo.desktopEnv === "kde6" ||
                  systemInfo.desktopEnv === "kde5") && (
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{
                      background: "rgba(96,165,250,0.08)",
                      border: "1px solid rgba(96,165,250,0.2)",
                    }}
                  >
                    <Shield size={12} style={{ color: "#60a5fa" }} />
                    <p style={{ color: "#93c5fd", fontSize: "11px" }}>
                      KDE detected — will apply to{" "}
                      <strong>desktop + lock screen</strong>.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* ── Web fallback: OS selector ──────────────────────────────── */
              <>
                <div>
                  <p className="mb-2" style={sL}>
                    Operating System
                  </p>
                  <div className="flex gap-2">
                    {(["linux", "macos", "windows"] as DetectedOS[]).map(
                      (os) => (
                        <button
                          key={os}
                          onClick={() => setSelectedOS(os)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl"
                          style={pill(selectedOS === os, OS_COLORS[os])}
                        >
                          <span
                            style={{
                              color:
                                selectedOS === os
                                  ? OS_COLORS[os]
                                  : "var(--wh-text-4)",
                            }}
                          >
                            {OS_ICONS[os]}
                          </span>
                          <span>{OS_LABELS[os]}</span>
                          {detectedOS === os && (
                            <span
                              className="px-1.5 py-0.5 rounded-full"
                              style={{
                                background: `${OS_COLORS[os]}30`,
                                color: OS_COLORS[os],
                                fontSize: "9px",
                                fontWeight: 700,
                              }}
                            >
                              AUTO
                            </span>
                          )}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {selectedOS === "linux" && (
                  <>
                    <div>
                      <p className="mb-2" style={sL}>
                        Display Server
                      </p>
                      <div className="flex gap-2">
                        {(["wayland", "x11"] as DisplayServer[]).map((ds) => (
                          <button
                            key={ds}
                            onClick={() => setDisplayServer(ds)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={pill(displayServer === ds, "#a78bfa")}
                          >
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontSize: "11px",
                              }}
                            >
                              {ds === "wayland" ? "⬡" : "✕"}
                            </span>
                            <span className="capitalize">{ds}</span>
                            {ds === "wayland" && (
                              <span
                                style={{
                                  color:
                                    displayServer === "wayland"
                                      ? "#a78bfa"
                                      : "var(--wh-text-4)",
                                  fontSize: "9px",
                                }}
                              >
                                (recommended)
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2" style={sL}>
                        Desktop Environment
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {LINUX_DES.filter((de) =>
                          displayServer === "wayland" ? de.wayland : de.x11,
                        ).map(({ id }) => (
                          <button
                            key={id}
                            onClick={() => setLinuxDE(id)}
                            className="px-2 py-2.5 rounded-xl text-center"
                            style={pill(linuxDE === id, "#a78bfa")}
                          >
                            <span style={{ fontSize: "11px" }}>
                              {DE_LABELS[id]}
                            </span>
                          </button>
                        ))}
                      </div>
                      <p
                        className="mt-2"
                        style={{ color: "var(--wh-text-4)", fontSize: "11px" }}
                      >
                        {DE_DESCRIPTIONS[linuxDE]}
                      </p>
                      {(linuxDE === "kde6" || linuxDE === "kde5") && (
                        <div
                          className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                          style={{
                            background: "rgba(96,165,250,0.08)",
                            border: "1px solid rgba(96,165,250,0.2)",
                          }}
                        >
                          <Shield size={12} style={{ color: "#60a5fa" }} />
                          <p style={{ color: "#93c5fd", fontSize: "11px" }}>
                            Script applies wallpaper to{" "}
                            <strong>desktop + lock screen</strong>.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── Progress bar (Electron only) ─────────────────────────────── */}
            {isElectron && (
              <ProgressBar
                stage={applyStage}
                progress={applyPct}
                message={applyMsg}
                error={applyError}
              />
            )}

            {/* ── Script (web fallback + always-available for power users) ── */}
            {!isElectron && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p style={sL}>Auto-Apply Script</p>
                  <button
                    onClick={() => setScriptExpanded(!scriptExpanded)}
                    className="flex items-center gap-1"
                    style={{ color: "var(--wh-text-3)", fontSize: "11px" }}
                  >
                    <ChevronRight
                      size={12}
                      style={{
                        transform: scriptExpanded ? "rotate(90deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    />
                    <span>{scriptExpanded ? "Collapse" : "Preview"}</span>
                  </button>
                </div>

                {!scriptExpanded ? (
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: "var(--wh-overlay-xs)",
                      border: "1px solid var(--wh-border)",
                    }}
                  >
                    <FileCode2
                      size={16}
                      style={{ color: "var(--wh-text-3)", flexShrink: 0 }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        style={{
                          color: "var(--wh-text-1)",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        {script.filename}
                      </p>
                      <p
                        style={{ color: "var(--wh-text-4)", fontSize: "11px" }}
                      >
                        {script.lang === "bash" ? "Bash" : "PowerShell"} ·{" "}
                        {script.code.split("\n").length} lines
                      </p>
                    </div>
                    <button
                      onClick={() => setScriptExpanded(true)}
                      style={{ color: "var(--wh-text-4)", fontSize: "11px" }}
                    >
                      View
                    </button>
                  </div>
                ) : (
                  <div
                    className="relative rounded-xl overflow-hidden"
                    style={{ border: "1px solid var(--wh-border)" }}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 px-3 py-2 flex items-center justify-between z-10"
                      style={{
                        background: "var(--wh-surface-2)",
                        borderBottom: "1px solid var(--wh-border)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
                            <div
                              key={c}
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ background: c, opacity: 0.6 }}
                            />
                          ))}
                        </div>
                        <span
                          style={{
                            color: "var(--wh-text-4)",
                            fontSize: "11px",
                            fontFamily: "monospace",
                          }}
                        >
                          {script.filename}
                        </span>
                      </div>
                      <button
                        onClick={handleCopyScript}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                        style={{
                          background: copiedScr
                            ? "rgba(16,185,129,0.15)"
                            : "var(--wh-overlay-md)",
                          color: copiedScr ? "#34d399" : "var(--wh-text-3)",
                          fontSize: "11px",
                        }}
                      >
                        {copiedScr ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copiedScr ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>
                    <pre
                      className="overflow-auto p-4 pt-12"
                      style={{
                        background: "#0d0f17",
                        color: "#e2e8f0",
                        fontSize: "11px",
                        lineHeight: 1.75,
                        maxHeight: "240px",
                        margin: 0,
                        fontFamily: "'Fira Code', monospace",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: highlightScript(script.code, script.lang),
                      }}
                    />
                  </div>
                )}

                <div
                  className="mt-3 rounded-xl p-3.5"
                  style={{
                    background: "var(--wh-overlay-xs)",
                    border: "1px solid var(--wh-border)",
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle
                      size={13}
                      className="shrink-0 mt-0.5"
                      style={{ color: "var(--wh-text-4)" }}
                    />
                    <p
                      style={{
                        color: "var(--wh-text-3)",
                        fontSize: "11px",
                        lineHeight: 1.7,
                      }}
                    >
                      {selectedOS === "windows" ? (
                        <>
                          Download the script, then run:{" "}
                          <code
                            style={{
                              color: "#93c5fd",
                              fontFamily: "monospace",
                            }}
                          >
                            powershell -ExecutionPolicy Bypass -File
                            wolly-apply.ps1
                          </code>
                        </>
                      ) : (
                        <>
                          Download the script, then:{" "}
                          <code
                            style={{
                              color: "#86efac",
                              fontFamily: "monospace",
                            }}
                          >
                            chmod +x wolly-apply.sh && ./wolly-apply.sh
                          </code>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          <div
            className="p-5 pt-4 border-t flex gap-3 shrink-0"
            style={{ borderColor: "var(--wh-border)" }}
          >
            {isElectron ? (
              /* Native Electron buttons */
              <>
                <button
                  onClick={handleNativeApply}
                  disabled={
                    applyStage === "downloading" || applyStage === "applying"
                  }
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
                  style={{
                    background: hasApplied
                      ? "rgba(16,185,129,0.15)"
                      : applyStage === "downloading" ||
                          applyStage === "applying"
                        ? "rgba(124,58,237,0.2)"
                        : "linear-gradient(135deg,#7c3aed,#4f46e5)",
                    border: hasApplied
                      ? "1px solid rgba(16,185,129,0.3)"
                      : "1px solid transparent",
                    color: hasApplied ? "#34d399" : "#fff",
                    boxShadow:
                      !hasApplied && applyStage === "idle"
                        ? "0 4px 20px rgba(124,58,237,0.3)"
                        : "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor:
                      applyStage !== "idle" && !hasApplied
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {hasApplied ? (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Applied!</span>
                    </>
                  ) : applyStage === "downloading" ||
                    applyStage === "applying" ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Working…</span>
                    </>
                  ) : (
                    <>
                      <Zap size={15} />
                      <span>Download & Apply Now</span>
                    </>
                  )}
                </button>
                {hasApplied && (
                  <button
                    onClick={onClose}
                    className="px-5 py-3 rounded-xl border transition-all"
                    style={{
                      background: "var(--wh-overlay-sm)",
                      borderColor: "var(--wh-border)",
                      color: "var(--wh-text-2)",
                      fontSize: "12px",
                    }}
                  >
                    Close
                  </button>
                )}
              </>
            ) : (
              /* Web script fallback buttons */
              <>
                <button
                  onClick={handleDownloadImage}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all"
                  style={{
                    background: downloaded
                      ? "rgba(16,185,129,0.12)"
                      : "var(--wh-overlay-sm)",
                    borderColor: downloaded
                      ? "rgba(16,185,129,0.3)"
                      : "var(--wh-border)",
                    color: downloaded ? "#34d399" : "var(--wh-text-2)",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  {downloaded ? <Check size={14} /> : <Download size={14} />}
                  <span>{downloaded ? "Downloaded" : "Image"}</span>
                </button>
                <button
                  onClick={handleDownloadScript}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
                  style={{
                    background: dlScript
                      ? "rgba(16,185,129,0.15)"
                      : "linear-gradient(135deg,#7c3aed,#4f46e5)",
                    border: dlScript
                      ? "1px solid rgba(16,185,129,0.3)"
                      : "1px solid transparent",
                    color: dlScript ? "#34d399" : "#fff",
                    boxShadow: !dlScript
                      ? "0 4px 20px rgba(124,58,237,0.3)"
                      : "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {dlScript ? (
                    <>
                      <Check size={15} />
                      <span>Script Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Zap size={15} />
                      <span>Download Script & Apply</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    onApplied(wallpaper.id);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all"
                  style={{
                    background: "var(--wh-overlay-sm)",
                    borderColor: "var(--wh-border)",
                    color: "var(--wh-text-3)",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--wh-hover-sm)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--wh-overlay-sm)";
                  }}
                >
                  <Check size={14} />
                  <span>Already set</span>
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
