import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Monitor,
  CheckCircle2,
  XCircle,
  Download,
  Trash2,
  FolderOpen,
  RefreshCw,
  AlertCircle,
  Info,
  Loader2,
  LayoutGrid,
} from "lucide-react";
import { WollyIcon } from "./WollyIcon";
import type { DesktopStatus } from "../../types/electron";

// ─── Only shown in Electron on Linux ─────────────────────────────────────────

export function DesktopIntegrationCard() {
  const api = window.electronAPI;

  // Only relevant on Linux inside Electron
  if (!api || api.platform !== "linux") return null;

  return <DesktopIntegrationCardInner api={api} />;
}

// ─── Inner (api is guaranteed non-null here) ─────────────────────────────────

function DesktopIntegrationCardInner({
  api,
}: {
  api: NonNullable<typeof window.electronAPI>;
}) {
  const [status, setStatus] = useState<DesktopStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  // ── Load status ────────────────────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const s = await api.desktopStatus();
      setStatus(s);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // ── Install ────────────────────────────────────────────────────────────────
  const handleInstall = useCallback(async () => {
    setWorking(true);
    setResult(null);
    try {
      const res = await api.desktopInstall();
      if (res.success) {
        setResult({ ok: true, msg: `Installed to ${res.desktopPath}` });
        await loadStatus();
      } else {
        setResult({ ok: false, msg: res.error ?? "Install failed" });
      }
    } finally {
      setWorking(false);
    }
  }, [api, loadStatus]);

  // ── Uninstall ──────────────────────────────────────────────────────────────
  const handleUninstall = useCallback(async () => {
    setWorking(true);
    setResult(null);
    try {
      const res = await api.desktopUninstall();
      if (res.success) {
        setResult({ ok: true, msg: "Removed from application menu" });
        await loadStatus();
      } else {
        setResult({ ok: false, msg: res.error ?? "Uninstall failed" });
      }
    } finally {
      setWorking(false);
    }
  }, [api, loadStatus]);

  // ── Open location ──────────────────────────────────────────────────────────
  const handleOpenLocation = useCallback(async () => {
    await api.desktopOpenLocation();
  }, [api]);

  // ── Shared styles ──────────────────────────────────────────────────────────
  const sL: React.CSSProperties = {
    color: "var(--wh-text-4)",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
  };
  const mono: React.CSSProperties = {
    fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "var(--wh-text-3)",
    wordBreak: "break-all",
  };

  const isInstalled = status?.installed ?? false;

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{
        background: "var(--wh-overlay-xs)",
        borderColor: "var(--wh-border)",
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.15)" }}
        >
          <LayoutGrid size={16} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="m-0"
            style={{
              color: "var(--wh-text-1)",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Desktop Integration
          </h3>
          <p
            className="mt-0.5"
            style={{ color: "var(--wh-text-3)", fontSize: "12px" }}
          >
            Add Wolly to your application launcher / menu
          </p>
        </div>
        <button
          onClick={loadStatus}
          disabled={loading}
          title="Refresh status"
          className="p-1.5 rounded-lg transition-colors"
          style={{
            color: "var(--wh-text-4)",
            background: "var(--wh-overlay-sm)",
            border: "1px solid var(--wh-border)",
          }}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 justify-center">
          <Loader2
            size={14}
            className="animate-spin"
            style={{ color: "var(--wh-text-4)" }}
          />
          <span style={{ color: "var(--wh-text-4)", fontSize: "12px" }}>
            Checking…
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── Status badge ────────────────────────────────────────────── */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: isInstalled
                ? "rgba(52,211,153,0.07)"
                : "rgba(255,255,255,0.03)",
              border: `1px solid ${isInstalled ? "rgba(52,211,153,0.2)" : "var(--wh-border)"}`,
            }}
          >
            {isInstalled ? (
              <CheckCircle2
                size={16}
                style={{ color: "#34d399", flexShrink: 0 }}
              />
            ) : (
              <XCircle
                size={16}
                style={{ color: "var(--wh-text-4)", flexShrink: 0 }}
              />
            )}
            <div className="flex-1 min-w-0">
              <p
                style={{
                  color: isInstalled ? "#34d399" : "var(--wh-text-2)",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {isInstalled
                  ? "Installed in application menu"
                  : "Not installed"}
              </p>
              <p style={{ color: "var(--wh-text-4)", fontSize: "11px" }}>
                {isInstalled
                  ? "Wolly appears in your desktop launcher"
                  : "Click Install to add it to your launcher"}
              </p>
            </div>
          </div>

          {/* ── Preview card ─────────────────────────────────────────────── */}
          <div>
            <p className="mb-2.5" style={sL}>
              App Entry Preview
            </p>
            <div
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl"
              style={{
                background: "var(--wh-surface-2)",
                border: "1px solid var(--wh-border)",
              }}
            >
              {/* Icon preview */}
              <div className="shrink-0">
                <WollyIcon size={48} rounded useCustomIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    color: "var(--wh-text-1)",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  Wolly
                </p>
                <p
                  style={{
                    color: "var(--wh-text-3)",
                    fontSize: "12px",
                    marginTop: 2,
                  }}
                >
                  Browse and apply beautiful wallpapers from wallhaven.cc
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["Utility", "Graphics", "Photography"].map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(124,58,237,0.12)",
                        color: "#a78bfa",
                        fontSize: "10px",
                        fontWeight: 600,
                        border: "1px solid rgba(124,58,237,0.2)",
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <div
                className="px-2.5 py-1 rounded-full text-xs shrink-0"
                style={{
                  background: "rgba(124,58,237,0.12)",
                  color: "#a78bfa",
                  border: "1px solid rgba(124,58,237,0.2)",
                }}
              >
                .desktop
              </div>
            </div>
          </div>

          {/* ── File paths ───────────────────────────────────────────────── */}
          {status && (
            <div>
              <p className="mb-2" style={sL}>
                File Locations
              </p>
              <div
                className="rounded-xl overflow-hidden divide-y"
                style={{
                  border: "1px solid var(--wh-border)",
                  divideColor: "var(--wh-border)",
                }}
              >
                {[
                  { label: ".desktop", path: status.desktopPath },
                  { label: "SVG icon", path: status.iconPath },
                  { label: "Exec", path: status.execPath },
                ].map(({ label, path: p }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 px-3 py-2.5"
                    style={{ borderBottom: "1px solid var(--wh-border)" }}
                  >
                    <span
                      className="shrink-0 px-1.5 py-0.5 rounded"
                      style={{
                        background: "var(--wh-overlay-sm)",
                        color: "var(--wh-text-4)",
                        fontSize: "9px",
                        fontWeight: 700,
                        minWidth: 52,
                        textAlign: "center",
                      }}
                    >
                      {label}
                    </span>
                    <span className="flex-1 min-w-0 truncate" style={mono}>
                      {p}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Dev-mode notice ──────────────────────────────────────────── */}
          {status?.isDev && (
            <div
              className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
              style={{
                background: "rgba(245,158,11,0.07)",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              <Info
                size={13}
                style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }}
              />
              <div>
                <p
                  style={{
                    color: "#fcd34d",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Development mode
                </p>
                <p
                  style={{
                    color: "#fde68a",
                    fontSize: "11px",
                    marginTop: 2,
                    lineHeight: 1.6,
                  }}
                >
                  The Exec path points to the dev Electron binary. Build a
                  distributable (
                  <code style={{ fontFamily: "monospace" }}>
                    pnpm electron:build:linux
                  </code>
                  ) before installing for end-user use.
                </p>
              </div>
            </div>
          )}

          {/* ── Wayland Exec note ─────────────────────────────────────────── */}
          <div
            className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
            style={{
              background: "rgba(124,58,237,0.06)",
              border: "1px solid rgba(124,58,237,0.15)",
            }}
          >
            <Monitor
              size={12}
              style={{ color: "#a78bfa", flexShrink: 0, marginTop: 1 }}
            />
            <p
              style={{
                color: "var(--wh-text-3)",
                fontSize: "11px",
                lineHeight: 1.6,
              }}
            >
              The generated{" "}
              <code style={{ fontFamily: "monospace", color: "#a78bfa" }}>
                .desktop
              </code>{" "}
              file includes{" "}
              <code style={{ fontFamily: "monospace", color: "#a78bfa" }}>
                --ozone-platform-hint=auto
              </code>{" "}
              so the app launches natively on Wayland without XWayland.
            </p>
          </div>

          {/* ── Result feedback ──────────────────────────────────────────── */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
                style={{
                  background: result.ok
                    ? "rgba(52,211,153,0.08)"
                    : "rgba(248,113,113,0.08)",
                  border: `1px solid ${result.ok ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
                }}
              >
                {result.ok ? (
                  <CheckCircle2
                    size={14}
                    style={{ color: "#34d399", flexShrink: 0 }}
                  />
                ) : (
                  <AlertCircle
                    size={14}
                    style={{ color: "#f87171", flexShrink: 0 }}
                  />
                )}
                <span
                  style={{
                    color: result.ok ? "#6ee7b7" : "#fca5a5",
                    fontSize: "12px",
                    wordBreak: "break-all",
                  }}
                >
                  {result.msg}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Action buttons ───────────────────────────────────────────── */}
          <div className="flex gap-3 pt-1">
            {!isInstalled ? (
              <button
                onClick={handleInstall}
                disabled={working}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
                style={{
                  background: working
                    ? "rgba(124,58,237,0.2)"
                    : "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  border: "1px solid transparent",
                  color: "#fff",
                  boxShadow: working
                    ? "none"
                    : "0 4px 20px rgba(124,58,237,0.3)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: working ? "not-allowed" : "pointer",
                  opacity: working ? 0.7 : 1,
                }}
              >
                {working ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Installing…</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Install to App Menu</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={handleOpenLocation}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all"
                  style={{
                    background: "var(--wh-overlay-sm)",
                    borderColor: "var(--wh-border)",
                    color: "var(--wh-text-2)",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--wh-overlay-md)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--wh-overlay-sm)";
                  }}
                >
                  <FolderOpen size={13} />
                  <span>Open Location</span>
                </button>

                <button
                  onClick={handleUninstall}
                  disabled={working}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all"
                  style={{
                    background: working
                      ? "rgba(239,68,68,0.05)"
                      : "rgba(239,68,68,0.08)",
                    borderColor: "rgba(239,68,68,0.25)",
                    color: "#f87171",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: working ? "not-allowed" : "pointer",
                    opacity: working ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!working)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(239,68,68,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(239,68,68,0.08)";
                  }}
                >
                  {working ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Removing…</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Remove from App Menu</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
