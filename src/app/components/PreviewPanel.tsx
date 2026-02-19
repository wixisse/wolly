import { useState } from "react";
import {
  X,
  Monitor,
  Download,
  Heart,
  Eye,
  Calendar,
  Tag,
  Layers,
  ExternalLink,
  Check,
  User,
  FileImage,
  Maximize2,
} from "lucide-react";
import { Wallpaper } from "../types";
import { motion } from "motion/react";
import { ApplyModal } from "./ApplyModal";

interface PreviewPanelProps {
  wallpaper: Wallpaper;
  isFavorite: boolean;
  isApplied: boolean;
  onClose: () => void;
  onFavorite: (id: string) => void;
  onApply: (id: string) => void;
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return s;
  }
}

type DisplayMode = "fill" | "fit" | "stretch" | "tile" | "center";
const catColors = { general: "#60a5fa", anime: "#f472b6", people: "#fbbf24" };

export function PreviewPanel({
  wallpaper,
  isFavorite,
  isApplied,
  onClose,
  onFavorite,
  onApply,
}: PreviewPanelProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("fill");
  const [showFull, setShowFull] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const metaRows = [
    {
      icon: <FileImage size={13} />,
      label: "Resolution",
      value: wallpaper.resolution,
    },
    {
      icon: <Layers size={13} />,
      label: "File Size",
      value: wallpaper.fileSize,
    },
    { icon: <User size={13} />, label: "Uploader", value: wallpaper.uploader },
    {
      icon: <Calendar size={13} />,
      label: "Uploaded",
      value: fmtDate(wallpaper.uploadedAt),
    },
  ];

  const sectionLabel: React.CSSProperties = {
    color: "var(--wh-text-4)",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
  };

  const rowDivider: React.CSSProperties = {
    borderBottom: "1px solid var(--wh-border)",
  };

  return (
    <>
      <motion.div
        initial={{ x: 320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 320, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className="w-[320px] min-w-[320px] h-full flex flex-col border-l overflow-y-auto transition-colors duration-300"
        style={{
          background: "var(--wh-surface-1)",
          borderColor: "var(--wh-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3.5 border-b shrink-0"
          style={{ borderColor: "var(--wh-border)" }}
        >
          <span
            style={{
              color: "var(--wh-text-1)",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Wallpaper Details
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all"
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

        {/* Preview image */}
        <div className="relative shrink-0">
          <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
            <img
              src={wallpaper.thumbUrl}
              alt={wallpaper.tags[0]}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full pointer-events-none">
              <Monitor size={11} className="text-white/60" />
              <span className="text-white/60" style={{ fontSize: "10px" }}>
                {wallpaper.resolution}
              </span>
            </div>
            <button
              onClick={() => setShowFull(true)}
              className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white/60 hover:text-white hover:bg-black/70 transition-all"
            >
              <Maximize2 size={13} />
            </button>
          </div>
          {/* Color strip */}
          <div className="h-2 flex">
            {wallpaper.colors.map((c, i) => (
              <div
                key={i}
                className="flex-1 transition-all hover:flex-[2]"
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
          {/* Display mode */}
          <div>
            <p className="mb-2" style={sectionLabel}>
              Display Mode
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {(
                ["fill", "fit", "stretch", "tile", "center"] as DisplayMode[]
              ).map((m) => (
                <button
                  key={m}
                  onClick={() => setDisplayMode(m)}
                  className="py-2 rounded-lg text-center transition-all border"
                  style={{
                    background:
                      displayMode === m
                        ? "rgba(124,58,237,0.15)"
                        : "var(--wh-overlay-xs)",
                    borderColor:
                      displayMode === m
                        ? "rgba(124,58,237,0.4)"
                        : "var(--wh-border)",
                    color: displayMode === m ? "#a78bfa" : "var(--wh-text-3)",
                    fontSize: "10px",
                    fontWeight: 500,
                  }}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Apply button */}
          <button
            onClick={() => setShowApplyModal(true)}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl transition-all"
            style={{
              background: isApplied
                ? "rgba(16,185,129,0.15)"
                : "linear-gradient(135deg, #7c3aed, #4f46e5)",
              border: isApplied
                ? "1px solid rgba(16,185,129,0.3)"
                : "1px solid transparent",
              color: isApplied ? "#34d399" : "#fff",
              boxShadow: !isApplied
                ? "0 4px 20px rgba(124,58,237,0.3)"
                : "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isApplied ? (
              <>
                <Check size={15} />
                <span>Applied — Click to Re-apply</span>
              </>
            ) : (
              <>
                <Monitor size={15} />
                <span>Apply to Desktop</span>
              </>
            )}
          </button>

          {/* Secondary actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onFavorite(wallpaper.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all"
              style={{
                background: isFavorite
                  ? "rgba(244,63,94,0.12)"
                  : "var(--wh-overlay-xs)",
                borderColor: isFavorite
                  ? "rgba(244,63,94,0.3)"
                  : "var(--wh-border)",
                color: isFavorite ? "#f43f5e" : "var(--wh-text-2)",
                fontSize: "12px",
              }}
            >
              <Heart
                size={14}
                style={{ fill: isFavorite ? "#f43f5e" : "none" }}
              />
              <span>{isFavorite ? "Saved" : "Save"}</span>
            </button>
            <a
              href={wallpaper.fullUrl}
              download={`wallhaven-${wallpaper.id}.jpg`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all"
              style={{
                background: "var(--wh-overlay-xs)",
                borderColor: "var(--wh-border)",
                color: "var(--wh-text-2)",
                fontSize: "12px",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "var(--wh-hover-sm)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "var(--wh-overlay-xs)";
              }}
            >
              <Download size={14} />
              <span>Download</span>
            </a>
            <a
              href={
                wallpaper.source || `https://wallhaven.cc/w/${wallpaper.id}`
              }
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center p-2.5 rounded-xl border transition-all"
              style={{
                background: "var(--wh-overlay-xs)",
                borderColor: "var(--wh-border)",
                color: "var(--wh-text-2)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "var(--wh-hover-sm)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "var(--wh-overlay-xs)";
              }}
            >
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Metadata */}
          <div>
            <p className="mb-1" style={sectionLabel}>
              Details
            </p>
            {metaRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2.5"
                style={rowDivider}
              >
                <div
                  className="flex items-center gap-2.5"
                  style={{ color: "var(--wh-text-3)" }}
                >
                  {row.icon}
                  <span style={{ fontSize: "12px" }}>{row.label}</span>
                </div>
                <span style={{ color: "var(--wh-text-1)", fontSize: "12px" }}>
                  {row.value}
                </span>
              </div>
            ))}
            <div
              className="flex items-center justify-between py-2.5"
              style={rowDivider}
            >
              <div
                className="flex items-center gap-2.5"
                style={{ color: "var(--wh-text-3)" }}
              >
                <Layers size={13} />
                <span style={{ fontSize: "12px" }}>Category</span>
              </div>
              <span
                className="px-2.5 py-1 rounded-full capitalize"
                style={{
                  background: `${catColors[wallpaper.category]}20`,
                  color: catColors[wallpaper.category],
                  fontSize: "11px",
                }}
              >
                {wallpaper.category}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: <Eye size={12} />,
                label: "Views",
                value: fmt(wallpaper.views),
                color: "var(--wh-text-3)",
              },
              {
                icon: <Heart size={12} />,
                label: "Favorites",
                value: fmt(wallpaper.favorites),
                color: "#f43f5e",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-3 text-center border"
                style={{
                  background: "var(--wh-overlay-xs)",
                  borderColor: "var(--wh-border)",
                }}
              >
                <div
                  className="flex items-center justify-center gap-1.5 mb-1"
                  style={{ color: s.color }}
                >
                  {s.icon}
                  <span
                    style={{
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                <span
                  style={{
                    color: "var(--wh-text-1)",
                    fontSize: "17px",
                    fontWeight: 600,
                  }}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div>
            <div
              className="flex items-center gap-2 mb-2.5"
              style={{ color: "var(--wh-text-3)" }}
            >
              <Tag size={12} />
              <span style={sectionLabel}>Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {wallpaper.tags.map((tag) => (
                <button
                  key={tag}
                  className="px-3 py-1.5 rounded-lg border transition-all"
                  style={{
                    background: "var(--wh-overlay-xs)",
                    borderColor: "var(--wh-border)",
                    color: "var(--wh-text-2)",
                    fontSize: "11px",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--wh-hover-md)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--wh-overlay-xs)";
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Color palette */}
          <div>
            <p className="mb-2.5" style={sectionLabel}>
              Color Palette
            </p>
            <div className="flex gap-2">
              {wallpaper.colors.map((c, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1.5 flex-1"
                >
                  <div
                    className="w-full h-8 rounded-lg cursor-pointer hover:scale-105 transition-transform"
                    style={{ background: c }}
                    title={c}
                  />
                  <span style={{ color: "var(--wh-text-4)", fontSize: "9px" }}>
                    {c}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Full image preview */}
      {showFull && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={() => setShowFull(false)}
        >
          <img
            src={wallpaper.fullUrl}
            alt={wallpaper.tags[0]}
            className="max-w-full max-h-full rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
            onClick={() => setShowFull(false)}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Apply modal */}
      {showApplyModal && (
        <ApplyModal
          wallpaper={wallpaper}
          onClose={() => setShowApplyModal(false)}
          onApplied={(id) => {
            onApply(id);
            setShowApplyModal(false);
          }}
        />
      )}
    </>
  );
}
