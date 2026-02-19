import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { WallpaperGrid } from "./components/WallpaperGrid";
import { PreviewPanel } from "./components/PreviewPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { TitleBar } from "./components/TitleBar";
import { Wallpaper, Filters, NavView } from "./types";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { searchWallhaven, mapWH } from "./api/wallhaven";

const DEFAULT_FILTERS: Filters = {
  categories: ["general", "anime", "people"],
  sorting: "trending",
  resolution: "all",
  query: "",
};

// ─── App inner (consumes ThemeContext) ────────────────────────────────────────

function AppInner() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Navigation
  const [activeView, setActiveView] = useState<NavView>("trending");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Wallpaper data
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Selection & favorites
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(
    null,
  );
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteWallpapers, setFavoriteWallpapers] = useState<Wallpaper[]>([]);
  const [appliedWallpaperId, setAppliedWallpaperId] = useState<string | null>(
    null,
  );
  const [appliedWallpaper, setAppliedWallpaper] = useState<Wallpaper | null>(
    null,
  );

  // Debounce ref for query changes
  const queryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchPage = useCallback(
    async (
      targetPage: number,
      reset: boolean,
      currentFilters: Filters,
      currentView: NavView,
    ) => {
      if (currentView === "favorites" || currentView === "settings") return;

      // Cancel previous request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      if (reset) {
        setIsLoading(true);
        setApiError(null);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const resp = await searchWallhaven({
          filters: currentFilters,
          view: currentView,
          page: targetPage,
        });

        const mapped = resp.data.map(mapWH);

        setWallpapers((prev) => (reset ? mapped : [...prev, ...mapped]));
        setPage(targetPage);
        setHasMore(targetPage < resp.meta.last_page);
        setTotalCount(resp.meta.total);
        setApiError(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg.includes("AbortError") || msg === "AbortError") return;
        console.error("Wallhaven API error:", err);
        setApiError("Could not reach wallhaven.cc — check your connection.");
        toast.error("API unavailable", {
          description: "Could not reach wallhaven.cc. Try refreshing.",
          style: {
            background: "var(--wh-surface-2)",
            border: "1px solid var(--wh-border-strong)",
            color: "var(--wh-text-1)",
          },
        });
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  // Reset & load on view/filter change
  const doReset = useCallback(
    (nextFilters: Filters, nextView: NavView) => {
      setSelectedWallpaper(null);
      setWallpapers([]);
      setPage(1);
      setHasMore(true);
      fetchPage(1, true, nextFilters, nextView);
    },
    [fetchPage],
  );

  // Initial load
  useEffect(() => {
    fetchPage(1, true, DEFAULT_FILTERS, "trending");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load more (called by IntersectionObserver in WallpaperGrid)
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      fetchPage(page + 1, false, filters, activeView);
    }
  }, [isLoadingMore, hasMore, isLoading, page, filters, activeView, fetchPage]);

  // View change
  const handleViewChange = useCallback(
    (view: NavView) => {
      setActiveView(view);
      if (view !== "favorites" && view !== "settings") {
        doReset(filters, view);
      } else {
        setSelectedWallpaper(null);
      }
    },
    [filters, doReset],
  );

  // Filter change (debounce query)
  const handleFiltersChange = useCallback(
    (next: Filters) => {
      setFilters(next);
      if (queryTimer.current) clearTimeout(queryTimer.current);
      if (next.query !== filters.query) {
        queryTimer.current = setTimeout(() => doReset(next, activeView), 500);
      } else {
        doReset(next, activeView);
      }
    },
    [filters.query, activeView, doReset],
  );

  // Refresh
  const handleRefresh = useCallback(() => {
    doReset(filters, activeView);
    toast.success("Refreshed!", {
      style: {
        background: "var(--wh-surface-2)",
        border: "1px solid var(--wh-border-strong)",
        color: "var(--wh-text-1)",
      },
    });
  }, [filters, activeView, doReset]);

  // Favorite toggle
  const handleFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const adding = !prev.includes(id);
        toast(adding ? "Added to favorites" : "Removed from favorites", {
          icon: adding ? "❤️" : undefined,
          style: {
            background: "var(--wh-surface-2)",
            border: "1px solid var(--wh-border-strong)",
            color: "var(--wh-text-1)",
          },
        });
        return adding ? [...prev, id] : prev.filter((f) => f !== id);
      });
      setFavoriteWallpapers((prev) => {
        const exists = prev.find((w) => w.id === id);
        if (exists) return prev.filter((w) => w.id !== id);
        const wp = wallpapers.find((w) => w.id === id);
        return wp ? [...prev, wp] : prev;
      });
    },
    [wallpapers],
  );

  // Apply
  const handleApply = useCallback(
    (id: string) => {
      setAppliedWallpaperId(id);
      const wp =
        wallpapers.find((w) => w.id === id) ??
        favoriteWallpapers.find((w) => w.id === id) ??
        null;
      setAppliedWallpaper(wp);
      toast.success("Wallpaper marked as active!", {
        description: wp ? `${wp.resolution} · ${wp.fileSize}` : undefined,
        icon: "🖥️",
        style: {
          background: "var(--wh-surface-2)",
          border: "1px solid rgba(124,58,237,0.4)",
          color: "var(--wh-text-1)",
        },
      });
    },
    [wallpapers, favoriteWallpapers],
  );

  const isSettingsView = activeView === "settings";
  const isFavoritesView = activeView === "favorites";

  const displayWallpapers = isFavoritesView ? favoriteWallpapers : wallpapers;

  // Show the custom TitleBar only in CSD (client-side decoration) mode
  const api = window.electronAPI;
  const isCSD = api?.windowDeco === "client" && api?.platform !== "darwin";

  return (
    <div className={isDark ? "dark" : ""} style={{ display: "contents" }}>
      <div
        className="flex flex-col h-screen w-screen overflow-hidden transition-colors duration-400"
        style={{
          background: "var(--wh-bg)",
          fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
        }}
      >
        <Toaster position="bottom-right" />

        {/* Custom TitleBar — only in CSD (frameless) mode */}
        {isCSD && <TitleBar />}

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            activeView={activeView}
            onViewChange={handleViewChange}
            favoritesCount={favorites.length}
          />

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {isSettingsView ? (
              <div className="flex-1 overflow-y-auto">
                <SettingsPanel />
              </div>
            ) : (
              <>
                <TopBar
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  activeView={activeView}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  totalCount={isFavoritesView ? favorites.length : totalCount}
                  onRefresh={handleRefresh}
                  isLoading={isLoading}
                />

                {/* API error banner */}
                {apiError && (
                  <div
                    className="mx-5 mt-3 px-4 py-3 rounded-xl border flex items-center gap-3 shrink-0"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      borderColor: "rgba(239,68,68,0.2)",
                      color: "#f87171",
                      fontSize: "12px",
                    }}
                  >
                    <span>⚠</span>
                    <span>{apiError} — Using cached data if available.</span>
                    <button
                      onClick={handleRefresh}
                      className="ml-auto underline"
                      style={{ color: "#f87171" }}
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div className="flex flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto">
                    <WallpaperGrid
                      wallpapers={displayWallpapers}
                      selectedWallpaper={selectedWallpaper}
                      favorites={favorites}
                      appliedWallpaperId={appliedWallpaperId}
                      onSelect={setSelectedWallpaper}
                      onFavorite={handleFavorite}
                      viewMode={viewMode}
                      isLoading={isLoading}
                      isLoadingMore={isLoadingMore}
                      hasMore={isFavoritesView ? false : hasMore}
                      onLoadMore={handleLoadMore}
                    />
                  </div>

                  <AnimatePresence>
                    {selectedWallpaper && (
                      <PreviewPanel
                        wallpaper={selectedWallpaper}
                        isFavorite={favorites.includes(selectedWallpaper.id)}
                        isApplied={appliedWallpaperId === selectedWallpaper.id}
                        onClose={() => setSelectedWallpaper(null)}
                        onFavorite={handleFavorite}
                        onApply={handleApply}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Active wallpaper status bar */}
        {appliedWallpaper && !isSettingsView && (
          <div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-2xl z-50 pointer-events-none backdrop-blur-xl"
            style={{
              background: "var(--wh-surface-2)",
              border: "1px solid var(--wh-border-strong)",
              maxWidth: "360px",
              boxShadow: isDark
                ? "0 8px 32px rgba(255,255,255,0.05)"
                : "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            <div className="w-10 h-7 rounded-md overflow-hidden shrink-0">
              <img
                src={appliedWallpaper.thumbUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p
                className="truncate"
                style={{
                  color: "var(--wh-text-2)",
                  fontSize: "11px",
                  fontWeight: 500,
                }}
              >
                Applied: {appliedWallpaper.tags[0]}
              </p>
              <p style={{ color: "var(--wh-text-4)", fontSize: "10px" }}>
                {appliedWallpaper.resolution} · {appliedWallpaper.fileSize}
              </p>
            </div>
            <div className="shrink-0 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
