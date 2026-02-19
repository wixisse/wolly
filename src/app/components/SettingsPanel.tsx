import { useState } from "react";
import {
  Key,
  Monitor,
  RefreshCw,
  Bell,
  Clock,
  Check,
  Sun,
  Moon,
  RotateCcw,
  Layers,
} from "lucide-react";
import { useTheme, ThemeMode } from "../context/ThemeContext";
import { DesktopIntegrationCard } from "./DesktopIntegration";

// ─── Shared primitives ────────────────────────────────────────────────────────

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-10 h-6 rounded-full relative transition-all duration-200 shrink-0"
      style={{ background: value ? "#7c3aed" : "var(--wh-overlay-lg)" }}
    >
      <div
        className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200"
        style={{
          left: value ? "20px" : "4px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

function SectionCard({
  icon,
  title,
  desc,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 border"
      style={{
        background: "var(--wh-overlay-xs)",
        borderColor: "var(--wh-border)",
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(124,58,237,0.15)" }}
        >
          <span className="text-violet-400">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="m-0"
              style={{
                color: "var(--wh-text-1)",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {title}
            </h3>
            {badge}
          </div>
          <p
            className="mt-0.5"
            style={{ color: "var(--wh-text-3)", fontSize: "12px" }}
          >
            {desc}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SettingRow({
  label,
  sub,
  right,
}: {
  label: string;
  sub?: string;
  right: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: "1px solid var(--wh-border)" }}
    >
      <div>
        <p style={{ color: "var(--wh-text-1)", fontSize: "13px" }}>{label}</p>
        {sub && (
          <p
            className="mt-0.5"
            style={{ color: "var(--wh-text-4)", fontSize: "11px" }}
          >
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const themeModes: { mode: ThemeMode; icon: React.ReactNode; label: string }[] =
  [
    { mode: "light", icon: <Sun size={15} />, label: "Light" },
    { mode: "system", icon: <Monitor size={15} />, label: "System" },
    { mode: "dark", icon: <Moon size={15} />, label: "Dark" },
  ];

// ─── Window Decorations Card ──────────────────────────────────────────────────
//
// Always rendered so the setting is visible in any environment.
// Controls are disabled when not running inside Electron on Linux.

function WindowDecorationsCard() {
  // All hooks are called unconditionally (Rules of Hooks).
  const api = window.electronAPI;
  const isElectron = !!api;
  const isLinux = api?.platform === "linux";
  const canControl = isElectron && isLinux;

  const [selected, setSelected] = useState<"server" | "client">(
    api?.windowDeco ?? "server",
  );
  const [pending, setPending] = useState<"server" | "client" | null>(null);
  const [saving, setSaving] = useState(false);

  const displayed = pending ?? selected;
  const needsRestart = pending !== null && pending !== selected;

  async function handleSelect(deco: "server" | "client") {
    if (!canControl || saving || deco === displayed) return;
    setSaving(true);
    await api!.appSettingsSet({ windowDecorations: deco });
    setPending(deco);
    setSaving(false);
  }

  async function handleRestart() {
    if (!api) return;
    await api.appSettingsRelaunch();
  }

  const opts: { value: "server" | "client"; label: string; desc: string }[] = [
    {
      value: "server",
      label: "Server-Side Decorations",
      desc: "The compositor / window manager draws the title bar (recommended)",
    },
    {
      value: "client",
      label: "Client-Side Decorations",
      desc: "Wolly renders its own frameless title bar inside the window",
    },
  ];

  const linuxBadge = !canControl ? (
    <span
      className="px-2 py-0.5 rounded-md"
      style={{
        background: "rgba(124,58,237,0.12)",
        color: "#a78bfa",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.04em",
      }}
    >
      Linux only
    </span>
  ) : undefined;

  return (
    <SectionCard
      icon={<Layers size={16} />}
      title="Window Decorations"
      desc="Choose who draws the title bar"
      badge={linuxBadge}
    >
      <div className="space-y-2">
        {opts.map(({ value, label, desc }) => {
          const isSelected = displayed === value;
          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              disabled={!canControl || saving}
              className="w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200"
              style={{
                background: isSelected
                  ? "rgba(124,58,237,0.10)"
                  : "var(--wh-overlay-xs)",
                borderColor: isSelected
                  ? "rgba(124,58,237,0.45)"
                  : "var(--wh-border)",
                cursor: !canControl ? "default" : saving ? "wait" : "pointer",
                opacity: !canControl ? 0.45 : saving ? 0.65 : 1,
              }}
            >
              {/* Radio dot */}
              <div
                className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                style={{
                  borderColor:
                    isSelected && canControl ? "#a78bfa" : "var(--wh-text-4)",
                }}
              >
                {isSelected && canControl && (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: "#a78bfa" }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    color:
                      isSelected && canControl ? "#a78bfa" : "var(--wh-text-1)",
                    fontSize: "13px",
                    fontWeight: isSelected && canControl ? 600 : 400,
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    color: "var(--wh-text-4)",
                    fontSize: "11px",
                    marginTop: 2,
                  }}
                >
                  {desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Restart banner */}
      {needsRestart && (
        <div
          className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{
            background: "rgba(251,191,36,0.07)",
            borderColor: "rgba(251,191,36,0.22)",
          }}
        >
          <RotateCcw size={14} style={{ color: "#fbbf24", flexShrink: 0 }} />
          <p style={{ color: "#fbbf24", fontSize: "12px", flex: 1 }}>
            Restart required for this change to take effect.
          </p>
          <button
            onClick={handleRestart}
            className="px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: "rgba(251,191,36,0.16)",
              border: "1px solid rgba(251,191,36,0.32)",
              color: "#fbbf24",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Restart Now
          </button>
        </div>
      )}

      {/* Non-Linux notice */}
      {!canControl && (
        <p
          className="mt-3 text-center"
          style={{ color: "var(--wh-text-4)", fontSize: "11px" }}
        >
          This setting only applies when running Wolly on Linux.
        </p>
      )}
    </SectionCard>
  );
}

// ─── Main settings panel ──────────────────────────────────────────────────────

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const [apiKey, setApiKey] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [multiMonitor, setMultiMonitor] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState("30");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const selectStyle: React.CSSProperties = {
    background: "var(--wh-overlay-sm)",
    border: "1px solid var(--wh-border)",
    borderRadius: "10px",
    padding: "8px 12px",
    color: "var(--wh-text-1)",
    fontSize: "12px",
    outline: "none",
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h1
          className="m-0"
          style={{
            color: "var(--wh-text-1)",
            fontSize: "22px",
            fontWeight: 700,
          }}
        >
          Settings
        </h1>
        <p
          className="mt-1"
          style={{ color: "var(--wh-text-3)", fontSize: "13px" }}
        >
          Configure your wallpaper applier preferences
        </p>
      </div>

      <div className="space-y-5">
        {/* ── Appearance ──────────────────────────────────────── */}
        <SectionCard
          icon={<Sun size={16} />}
          title="Appearance"
          desc="Choose how the app looks"
        >
          <div>
            <p
              className="mb-3"
              style={{ color: "var(--wh-text-3)", fontSize: "12px" }}
            >
              Color Theme
            </p>
            <div
              className="flex rounded-xl p-1 gap-1"
              style={{
                background: "var(--wh-overlay-sm)",
                border: "1px solid var(--wh-border)",
              }}
            >
              {themeModes.map(({ mode, icon, label }) => {
                const isActive = theme === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-200"
                    style={{
                      background: isActive
                        ? "var(--wh-surface-1)"
                        : "transparent",
                      color: isActive ? "#a78bfa" : "var(--wh-text-3)",
                      boxShadow: isActive
                        ? "0 1px 6px rgba(0,0,0,0.12)"
                        : "none",
                      fontSize: "13px",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {icon}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
            <p
              className="mt-2.5"
              style={{ color: "var(--wh-text-4)", fontSize: "11px" }}
            >
              "System" automatically matches your OS appearance setting
            </p>
          </div>
        </SectionCard>

        {/* ── Window Decorations ──────────────────────────────── */}
        <WindowDecorationsCard />

        {/* ── API Configuration ───────────────────────────────── */}
        <SectionCard
          icon={<Key size={16} />}
          title="API Configuration"
          desc="Connect to wallhaven.cc API"
        >
          <div>
            <label
              className="block mb-1.5"
              style={{ color: "var(--wh-text-2)", fontSize: "12px" }}
            >
              API Key
            </label>
            <input
              type="password"
              placeholder="Enter your Wallhaven API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-xl px-4 py-3 outline-none transition-all"
              style={{
                background: "var(--wh-input-bg)",
                border: "1px solid var(--wh-border)",
                color: "var(--wh-text-1)",
                fontSize: "13px",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--wh-border)";
              }}
            />
            <a
              href="https://wallhaven.cc/settings/account"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-violet-500 hover:text-violet-400 transition-colors"
              style={{ fontSize: "12px" }}
            >
              Get your API key from wallhaven.cc →
            </a>
          </div>
        </SectionCard>

        {/* ── Display Settings ────────────────────────────────── */}
        <SectionCard
          icon={<Monitor size={16} />}
          title="Display Settings"
          desc="Wallpaper display preferences"
        >
          <SettingRow
            label="Default Display Mode"
            sub="How wallpapers are scaled on your desktop"
            right={
              <select style={selectStyle}>
                {["Fill", "Fit", "Stretch", "Tile", "Center"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            }
          />
          <SettingRow
            label="Multi-Monitor Support"
            sub="Apply to all connected displays"
            right={<Toggle value={multiMonitor} onChange={setMultiMonitor} />}
          />
        </SectionCard>

        {/* ── Auto Wallpaper Change ───────────────────────────── */}
        <SectionCard
          icon={<RefreshCw size={16} />}
          title="Auto Wallpaper Change"
          desc="Automatically rotate wallpapers"
        >
          <SettingRow
            label="Enable Auto Change"
            right={<Toggle value={autoRefresh} onChange={setAutoRefresh} />}
          />
          {autoRefresh && (
            <div className="flex items-center gap-3 pt-3">
              <Clock size={14} style={{ color: "var(--wh-text-3)" }} />
              <span style={{ color: "var(--wh-text-2)", fontSize: "12px" }}>
                Change every
              </span>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
                style={selectStyle}
              >
                {[
                  ["5", "5 minutes"],
                  ["15", "15 minutes"],
                  ["30", "30 minutes"],
                  ["60", "1 hour"],
                  ["1440", "Daily"],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          )}
        </SectionCard>

        {/* ── Notifications ───────────────────────────────────── */}
        <SectionCard
          icon={<Bell size={16} />}
          title="Notifications"
          desc="Desktop notification preferences"
        >
          <SettingRow
            label="Show notification on wallpaper change"
            right={<Toggle value={notifications} onChange={setNotifications} />}
          />
        </SectionCard>

        {/* ── Desktop Integration (Linux + Electron) ──────────── */}
        <DesktopIntegrationCard />

        {/* ── Save ────────────────────────────────────────────── */}
        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all"
          style={{
            background: saved
              ? "rgba(16,185,129,0.15)"
              : "linear-gradient(135deg, #7c3aed, #4f46e5)",
            border: saved
              ? "1px solid rgba(16,185,129,0.3)"
              : "1px solid transparent",
            color: saved ? "#34d399" : "#fff",
            boxShadow: saved ? "none" : "0 4px 20px rgba(124,58,237,0.3)",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {saved ? (
            <>
              <Check size={16} />
              <span>Settings Saved!</span>
            </>
          ) : (
            <span>Save Settings</span>
          )}
        </button>
      </div>
    </div>
  );
}
