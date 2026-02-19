import { useState, useEffect, useCallback } from "react";
import { Minus, Square, X, Maximize2 } from "lucide-react";
import { WollyIcon } from "./WollyIcon";
import { useTheme } from "../context/ThemeContext";

/**
 * Custom title bar — rendered ONLY when the Electron window was opened in
 * frameless / client-side-decoration mode (windowDeco === "client").
 * On macOS the native traffic lights are always used.
 * In a browser (no electronAPI) this returns null.
 */
export function TitleBar() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [isMaximized, setIsMaximized] = useState(false);

  const api = window.electronAPI;

  // Only render for CSD mode on Linux (or Windows if ever enabled)
  if (!api || api.platform === "darwin" || api.windowDeco !== "client")
    return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    api.windowIsMaximized().then(setIsMaximized);
    const cleanup = api.onMaximizeChange(setIsMaximized);
    return cleanup;
  }, [api]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleMinimize = useCallback(() => api.windowMinimize(), [api]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleMaximize = useCallback(() => api.windowMaximize(), [api]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleClose = useCallback(() => api.windowClose(), [api]);

  return (
    <div
      className="flex items-center h-[38px] shrink-0 select-none"
      style={
        {
          background: isDark ? "#08060f" : "#f0edf8",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
          WebkitAppRegion: "drag",
        } as React.CSSProperties
      }
    >
      {/* App identity */}
      <div
        className="flex items-center gap-2 pl-3 flex-1 min-w-0"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <WollyIcon size={18} rounded useCustomIcon />
        <span
          className="truncate"
          style={{
            color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)",
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.01em",
          }}
        >
          Wolly
        </span>
      </div>

      {/* Window controls */}
      <WinButton
        onClick={handleMinimize}
        hoverBg={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
        title="Minimize"
      >
        <Minus
          size={11}
          style={{
            color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)",
          }}
        />
      </WinButton>

      <WinButton
        onClick={handleMaximize}
        hoverBg={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
        title={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? (
          <Maximize2
            size={10}
            style={{
              color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)",
            }}
          />
        ) : (
          <Square
            size={10}
            style={{
              color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)",
            }}
          />
        )}
      </WinButton>

      <WinButton
        onClick={handleClose}
        hoverBg="rgba(239,68,68,0.85)"
        hoverIconColor="#fff"
        title="Close"
      >
        <X
          size={11}
          style={{
            color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)",
          }}
        />
      </WinButton>
    </div>
  );
}

// ─── Helper: single window control button ────────────────────────────────────

function WinButton({
  children,
  onClick,
  hoverBg,
  hoverIconColor,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  hoverBg: string;
  hoverIconColor?: string;
  title: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={
        {
          width: 46,
          height: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: hovered ? hoverBg : "transparent",
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
          transition: "background 0.1s",
          WebkitAppRegion: "no-drag",
          color: hovered && hoverIconColor ? hoverIconColor : "inherit",
        } as React.CSSProperties
      }
    >
      {children}
    </button>
  );
}
