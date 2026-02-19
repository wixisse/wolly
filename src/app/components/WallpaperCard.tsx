import { useState } from "react";
import { Heart, Eye, Monitor, ZoomIn } from "lucide-react";
import { Wallpaper } from "../types";
import { useTheme } from "../context/ThemeContext";

interface WallpaperCardProps {
  wallpaper: Wallpaper;
  isSelected: boolean;
  isFavorite: boolean;
  isApplied: boolean;
  onSelect: (wallpaper: Wallpaper) => void;
  onFavorite: (id: string) => void;
  viewMode: "grid" | "list";
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export function WallpaperCard({
  wallpaper,
  isSelected,
  isFavorite,
  isApplied,
  onSelect,
  onFavorite,
  viewMode,
}: WallpaperCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // White glow in dark, muted shadow in light
  const selectedGlow = isDark
    ? "0 0 0 2px rgba(255,255,255,0.75), 0 0 28px rgba(255,255,255,0.18)"
    : "0 0 0 2px rgba(0,0,0,0.45), 0 0 20px rgba(0,0,0,0.12)";

  const hoverShadow = isDark
    ? "0 4px 24px rgba(255,255,255,0.07)"
    : "0 4px 20px rgba(0,0,0,0.13)";

  if (viewMode === "list") {
    return (
      <div
        onClick={() => onSelect(wallpaper)}
        className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 border"
        style={{
          background: isSelected
            ? "var(--wh-overlay-md)"
            : "var(--wh-overlay-xs)",
          borderColor: isSelected
            ? "var(--wh-border-strong)"
            : "var(--wh-border)",
          boxShadow: isSelected ? selectedGlow : "none",
        }}
        onMouseEnter={(e) => {
          if (!isSelected)
            (e.currentTarget as HTMLDivElement).style.background =
              "var(--wh-hover-sm)";
        }}
        onMouseLeave={(e) => {
          if (!isSelected)
            (e.currentTarget as HTMLDivElement).style.background =
              "var(--wh-overlay-xs)";
        }}
      >
        {/* Thumbnail */}
        <div
          className="w-24 h-14 rounded-lg overflow-hidden shrink-0 relative"
          style={{ background: "var(--wh-overlay-md)" }}
        >
          <img
            src={wallpaper.thumbUrl}
            alt={wallpaper.tags[0]}
            className="w-full h-full object-cover"
            onLoad={() => setImgLoaded(true)}
            style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.3s" }}
          />
          {isApplied && (
            <div className="absolute inset-0 bg-violet-600/30 flex items-center justify-center">
              <Monitor size={14} className="text-violet-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="truncate"
              style={{
                color: "var(--wh-text-1)",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {wallpaper.tags.slice(0, 2).join(", ")}
            </span>
            {isApplied && (
              <span
                className="shrink-0 px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(124,58,237,0.12)",
                  color: "#a78bfa",
                  fontSize: "10px",
                }}
              >
                Active
              </span>
            )}
          </div>
          <div
            className="flex items-center gap-3"
            style={{ color: "var(--wh-text-4)", fontSize: "11px" }}
          >
            <span>{wallpaper.resolution}</span>
            <span>{wallpaper.fileSize}</span>
            <span className="capitalize">{wallpaper.category}</span>
          </div>
        </div>

        {/* Stats */}
        <div
          className="flex items-center gap-4 shrink-0"
          style={{ color: "var(--wh-text-4)", fontSize: "11px" }}
        >
          <div className="flex items-center gap-1.5">
            <Eye size={12} />
            <span>{formatNumber(wallpaper.views)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart
              size={12}
              style={{
                color: isFavorite ? "#f43f5e" : "inherit",
                fill: isFavorite ? "#f43f5e" : "none",
              }}
            />
            <span>{formatNumber(wallpaper.favorites)}</span>
          </div>
        </div>

        {/* Fav button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite(wallpaper.id);
          }}
          className="p-2 rounded-lg transition-all shrink-0"
          style={{
            background: isFavorite
              ? "rgba(244,63,94,0.15)"
              : "var(--wh-overlay-sm)",
            color: isFavorite ? "#f43f5e" : "var(--wh-text-3)",
          }}
        >
          <Heart size={14} style={{ fill: isFavorite ? "#f43f5e" : "none" }} />
        </button>
      </div>
    );
  }

  // ── Grid card ────────────────────────────────────────────────────────────
  return (
    <div
      onClick={() => onSelect(wallpaper)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
      style={{
        aspectRatio: "16/10",
        boxShadow: isSelected ? selectedGlow : hovered ? hoverShadow : "none",
        transform: isSelected ? "scale(1.01)" : "scale(1)",
      }}
    >
      {/* Skeleton */}
      {!imgLoaded && (
        <div
          className="absolute inset-0 animate-pulse rounded-xl"
          style={{ background: "var(--wh-skeleton)" }}
        />
      )}

      {/* Image */}
      <img
        src={wallpaper.thumbUrl}
        alt={wallpaper.tags[0]}
        loading="lazy"
        className="w-full h-full object-cover transition-all duration-300"
        style={{
          transform: hovered ? "scale(1.05)" : "scale(1)",
          opacity: imgLoaded ? 1 : 0,
        }}
        onLoad={() => setImgLoaded(true)}
      />

      {/* Active badge */}
      {isApplied && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-violet-600/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
          <Monitor size={11} className="text-white" />
          <span
            className="text-white"
            style={{ fontSize: "10px", fontWeight: 600 }}
          >
            Active
          </span>
        </div>
      )}

      {/* Hover / selected overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent transition-opacity duration-200"
        style={{ opacity: hovered || isSelected ? 1 : 0 }}
      >
        {/* Actions */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(wallpaper.id);
            }}
            className="p-2 rounded-lg backdrop-blur-sm transition-all duration-200"
            style={{
              background: isFavorite
                ? "rgba(244,63,94,0.70)"
                : "rgba(0,0,0,0.40)",
              color: "#fff",
            }}
          >
            <Heart size={13} style={{ fill: isFavorite ? "#fff" : "none" }} />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg bg-black/40 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200"
          >
            <ZoomIn size={13} />
          </button>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex flex-wrap gap-1 mb-2">
            {wallpaper.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-black/40 backdrop-blur-sm text-white/70 rounded-full"
                style={{ fontSize: "10px" }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div
            className="flex items-center justify-between text-white/60"
            style={{ fontSize: "11px" }}
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye size={11} />
                {formatNumber(wallpaper.views)}
              </span>
              <span className="flex items-center gap-1">
                <Heart size={11} />
                {formatNumber(wallpaper.favorites)}
              </span>
            </div>
            <span>{wallpaper.resolution}</span>
          </div>
        </div>
      </div>

      {/* Color strip */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 flex"
        style={{
          opacity: hovered || isSelected ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      >
        {wallpaper.colors.slice(0, 5).map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>
    </div>
  );
}
