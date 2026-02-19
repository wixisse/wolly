import { useState } from "react";
import {
  Search,
  ChevronDown,
  LayoutGrid,
  LayoutList,
  RefreshCw,
} from "lucide-react";
import {
  Filters,
  NavView,
  ResolutionFilter,
  SortOption,
  CategoryFilter,
} from "../types";

interface TopBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  activeView: NavView;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  totalCount: number;
  onRefresh: () => void;
  isLoading: boolean;
}

const sortLabels: Record<SortOption, string> = {
  trending: "Trending",
  date_added: "Latest",
  views: "Most Viewed",
  favorites: "Most Favorited",
  random: "Random",
  toplist: "Top Rated",
};

const resolutions: ResolutionFilter[] = [
  "all",
  "1920x1080",
  "2560x1440",
  "3840x2160",
  "2560x1080",
  "1280x720",
];
const sortOptions: SortOption[] = [
  "trending",
  "date_added",
  "views",
  "favorites",
  "random",
  "toplist",
];

const viewTitles: Record<NavView, string> = {
  trending: "Trending",
  latest: "Latest",
  toplist: "Top Rated",
  random: "Random",
  favorites: "My Favorites",
  settings: "Settings",
};

export function TopBar({
  filters,
  onFiltersChange,
  activeView,
  viewMode,
  onViewModeChange,
  totalCount,
  onRefresh,
  isLoading,
}: TopBarProps) {
  const [showSort, setShowSort] = useState(false);
  const [showRes, setShowRes] = useState(false);

  const closeAll = () => {
    setShowSort(false);
    setShowRes(false);
  };

  const controlBase: React.CSSProperties = {
    background: "var(--wh-overlay-sm)",
    border: "1px solid var(--wh-border)",
    color: "var(--wh-text-2)",
    borderRadius: "12px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "background 0.2s",
  };

  const dropdownBase: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    background: "var(--wh-dropdown-bg)",
    border: "1px solid var(--wh-border-strong)",
    borderRadius: "14px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
    zIndex: 50,
    overflow: "hidden",
    minWidth: "170px",
  };

  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 border-b shrink-0 transition-colors duration-200"
      style={{
        background: "var(--wh-surface-1)",
        borderColor: "var(--wh-border)",
      }}
    >
      {/* Title */}
      <div className="shrink-0 mr-1">
        <h1
          className="m-0 p-0"
          style={{
            color: "var(--wh-text-1)",
            fontSize: "15px",
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {viewTitles[activeView]}
        </h1>
        <p
          className="mt-0.5"
          style={{ color: "var(--wh-text-4)", fontSize: "11px" }}
        >
          {totalCount.toLocaleString()} wallpapers
        </p>
      </div>

      {/* Search */}
      <div className="flex-1 relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--wh-text-4)" }}
        />
        <input
          type="text"
          placeholder="Search wallpapers, tags, uploaders..."
          value={filters.query}
          onChange={(e) =>
            onFiltersChange({ ...filters, query: e.target.value })
          }
          className="w-full rounded-xl pl-9 pr-4 py-2.5 outline-none transition-all"
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
      </div>

      {/* Sort dropdown */}
      <div className="relative shrink-0">
        <button
          onClick={() => {
            setShowSort(!showSort);
            setShowRes(false);
          }}
          className="flex items-center gap-2 px-3.5 py-2.5"
          style={controlBase}
        >
          <span>{sortLabels[filters.sorting]}</span>
          <ChevronDown
            size={12}
            style={{
              transform: showSort ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </button>
        {showSort && (
          <div style={dropdownBase}>
            {sortOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onFiltersChange({ ...filters, sorting: opt });
                  closeAll();
                }}
                className="w-full text-left px-4 py-2.5 transition-colors"
                style={{
                  background:
                    filters.sorting === opt
                      ? "rgba(124,58,237,0.12)"
                      : "transparent",
                  color:
                    filters.sorting === opt ? "#a78bfa" : "var(--wh-text-2)",
                  fontSize: "12px",
                }}
                onMouseEnter={(e) => {
                  if (filters.sorting !== opt)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--wh-hover-sm)";
                }}
                onMouseLeave={(e) => {
                  if (filters.sorting !== opt)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                }}
              >
                {sortLabels[opt]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resolution dropdown */}
      <div className="relative shrink-0">
        <button
          onClick={() => {
            setShowRes(!showRes);
            setShowSort(false);
          }}
          className="flex items-center gap-2 px-3.5 py-2.5"
          style={controlBase}
        >
          <span>
            {filters.resolution === "all" ? "All Res." : filters.resolution}
          </span>
          <ChevronDown
            size={12}
            style={{
              transform: showRes ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </button>
        {showRes && (
          <div style={dropdownBase}>
            {resolutions.map((res) => (
              <button
                key={res}
                onClick={() => {
                  onFiltersChange({ ...filters, resolution: res });
                  closeAll();
                }}
                className="w-full text-left px-4 py-2.5 transition-colors"
                style={{
                  background:
                    filters.resolution === res
                      ? "rgba(124,58,237,0.12)"
                      : "transparent",
                  color:
                    filters.resolution === res ? "#a78bfa" : "var(--wh-text-2)",
                  fontSize: "12px",
                }}
                onMouseEnter={(e) => {
                  if (filters.resolution !== res)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--wh-hover-sm)";
                }}
                onMouseLeave={(e) => {
                  if (filters.resolution !== res)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                }}
              >
                {res === "all" ? "All Resolutions" : res}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category toggles */}
      <div className="flex items-center gap-1.5 shrink-0">
        {(["general", "anime", "people"] as CategoryFilter[]).map((cat) => {
          const isActive = filters.categories.includes(cat);
          const cfg = {
            general: { color: "#60a5fa", label: "General" },
            anime: { color: "#f472b6", label: "Anime" },
            people: { color: "#fbbf24", label: "People" },
          }[cat];
          return (
            <button
              key={cat}
              title={isActive ? `Disable ${cfg.label}` : `Enable ${cfg.label}`}
              onClick={() => {
                const next = isActive
                  ? filters.categories.filter((c) => c !== cat)
                  : [...filters.categories, cat];
                if (next.length === 0) return; // keep at least one active
                onFiltersChange({ ...filters, categories: next });
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all duration-200 select-none"
              style={{
                background: isActive ? `${cfg.color}18` : "transparent",
                borderColor: isActive ? `${cfg.color}55` : "var(--wh-border)",
                color: isActive ? cfg.color : "var(--wh-text-4)",
                fontSize: "12px",
                opacity: isActive ? 1 : 0.55,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    `${cfg.color}40`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = isActive
                  ? "1"
                  : "0.55";
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "var(--wh-border)";
              }}
            >
              {/* Status dot — filled when active, hollow when inactive */}
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200"
                style={{
                  background: isActive ? cfg.color : "transparent",
                  border: isActive ? "none" : `1.5px solid ${cfg.color}80`,
                }}
              />
              <span style={{ fontWeight: isActive ? 500 : 400 }}>
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Refresh */}
      <button
        onClick={onRefresh}
        className="p-2.5 rounded-xl transition-all shrink-0"
        style={controlBase}
      >
        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
      </button>

      {/* View mode */}
      <div
        className="flex items-center rounded-xl overflow-hidden shrink-0"
        style={{ border: "1px solid var(--wh-border)" }}
      >
        {(["grid", "list"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className="p-2.5 transition-colors"
            style={{
              background:
                viewMode === mode ? "rgba(124,58,237,0.18)" : "transparent",
              color: viewMode === mode ? "#a78bfa" : "var(--wh-text-3)",
            }}
          >
            {mode === "grid" ? (
              <LayoutGrid size={14} />
            ) : (
              <LayoutList size={14} />
            )}
          </button>
        ))}
      </div>

      {/* Click-away overlay */}
      {(showSort || showRes) && (
        <div className="fixed inset-0 z-40" onClick={closeAll} />
      )}
    </div>
  );
}
