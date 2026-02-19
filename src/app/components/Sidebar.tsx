import { NavView } from "../types";
import { useTheme, ThemeMode } from "../context/ThemeContext";
import { WollyIcon } from "./WollyIcon";
import {
  Flame,
  Clock,
  Trophy,
  Shuffle,
  Heart,
  Settings,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

interface SidebarProps {
  activeView: NavView;
  onViewChange: (view: NavView) => void;
  favoritesCount: number;
}

const navItems: { view: NavView; label: string; icon: React.ReactNode }[] = [
  { view: "trending", label: "Trending", icon: <Flame size={17} /> },
  { view: "latest", label: "Latest", icon: <Clock size={17} /> },
  { view: "toplist", label: "Top Rated", icon: <Trophy size={17} /> },
  { view: "random", label: "Random", icon: <Shuffle size={17} /> },
];

const themeModes: { mode: ThemeMode; icon: React.ReactNode; label: string }[] =
  [
    { mode: "light", icon: <Sun size={14} />, label: "Light" },
    { mode: "system", icon: <Monitor size={14} />, label: "Auto" },
    { mode: "dark", icon: <Moon size={14} />, label: "Dark" },
  ];

export function Sidebar({
  activeView,
  onViewChange,
  favoritesCount,
}: SidebarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <aside
      className="w-[220px] min-w-[220px] h-full flex flex-col border-r select-none transition-colors duration-200"
      style={{
        background: "var(--wh-surface-1)",
        borderColor: "var(--wh-border)",
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 py-5 border-b"
        style={{ borderColor: "var(--wh-border)" }}
      >
        <WollyIcon size={32} rounded className="shrink-0" useCustomIcon />
        <div>
          <p
            style={{
              color: "var(--wh-text-1)",
              fontSize: "14px",
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            Wolly
          </p>
          <p
            style={{
              color: "var(--wh-text-4)",
              fontSize: "11px",
              marginTop: 2,
            }}
          >
            Desktop Applier
          </p>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <p
          className="px-2 mb-2.5"
          style={{
            color: "var(--wh-text-4)",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
          }}
        >
          Discover
        </p>

        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left"
              style={{
                background: isActive ? "rgba(124,58,237,0.12)" : "transparent",
                color: isActive ? "#a78bfa" : "var(--wh-text-3)",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--wh-hover-sm)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
              }}
            >
              <span
                style={{ color: isActive ? "#a78bfa" : "var(--wh-text-4)" }}
              >
                {item.icon}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 500 }}>
                {item.label}
              </span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
              )}
            </button>
          );
        })}

        <div
          className="my-3 border-t"
          style={{ borderColor: "var(--wh-border)" }}
        />

        <p
          className="px-2 mb-2.5 mt-1"
          style={{
            color: "var(--wh-text-4)",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
          }}
        >
          Library
        </p>

        {/* Favorites */}
        {(() => {
          const isActive = activeView === "favorites";
          return (
            <button
              onClick={() => onViewChange("favorites")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left"
              style={{
                background: isActive ? "rgba(244,63,94,0.10)" : "transparent",
                color: isActive ? "#fb7185" : "var(--wh-text-3)",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--wh-hover-sm)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
              }}
            >
              <Heart
                size={17}
                style={{ color: isActive ? "#fb7185" : "var(--wh-text-4)" }}
              />
              <span style={{ fontSize: "13px", fontWeight: 500 }}>
                Favorites
              </span>
              {favoritesCount > 0 && (
                <span
                  className="ml-auto px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(244,63,94,0.15)",
                    color: "#fb7185",
                    fontSize: "11px",
                  }}
                >
                  {favoritesCount}
                </span>
              )}
            </button>
          );
        })()}
      </div>

      {/* ── Bottom ────────────────────────────────────────────────────────── */}
      <div
        className="p-3 border-t space-y-2"
        style={{ borderColor: "var(--wh-border)" }}
      >
        {/* Theme switcher */}
        <div
          className="flex items-center rounded-xl p-1 gap-0.5"
          style={{
            background: "var(--wh-overlay-xs)",
            border: "1px solid var(--wh-border)",
          }}
        >
          {themeModes.map(({ mode, icon, label }) => {
            const isActive = theme === mode;
            return (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                title={label}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all duration-200"
                style={{
                  background: isActive ? "var(--wh-surface-1)" : "transparent",
                  color: isActive ? "#a78bfa" : "var(--wh-text-3)",
                  boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
                  fontSize: "11px",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings button */}
        {(() => {
          const isActive = activeView === "settings";
          return (
            <button
              onClick={() => onViewChange("settings")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
              style={{
                background: isActive ? "var(--wh-overlay-md)" : "transparent",
                color: isActive ? "var(--wh-text-1)" : "var(--wh-text-3)",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--wh-hover-sm)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    isActive ? "var(--wh-overlay-md)" : "transparent";
              }}
            >
              <Settings size={17} />
              <span style={{ fontSize: "13px", fontWeight: 500 }}>
                Settings
              </span>
            </button>
          );
        })()}

        {/* API status pill */}
        <div
          className="mx-1 p-2.5 rounded-xl"
          style={{
            background: "var(--wh-overlay-xs)",
            border: "1px solid var(--wh-border)",
          }}
        >
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span
              className="text-emerald-500"
              style={{ fontSize: "10px", fontWeight: 600 }}
            >
              API Connected
            </span>
          </div>
          <p style={{ color: "var(--wh-text-4)", fontSize: "10px" }}>
            wallhaven.cc/api/v1
          </p>
        </div>
      </div>
    </aside>
  );
}
