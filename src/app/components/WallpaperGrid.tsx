import { useEffect, useRef } from "react";
import { Wallpaper } from "../types";
import { WallpaperCard } from "./WallpaperCard";
import { Wind, Loader2 } from "lucide-react";

interface WallpaperGridProps {
  wallpapers: Wallpaper[];
  selectedWallpaper: Wallpaper | null;
  favorites: string[];
  appliedWallpaperId: string | null;
  onSelect: (wallpaper: Wallpaper) => void;
  onFavorite: (id: string) => void;
  viewMode: "grid" | "list";
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

function SkeletonGrid({ count, viewMode }: { count: number; viewMode: "grid" | "list" }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl animate-pulse"
          style={{
            background: "var(--wh-skeleton)",
            ...(viewMode === "grid" ? { aspectRatio: "16/10" } : { height: "72px" }),
          }}
        />
      ))}
    </>
  );
}

export function WallpaperGrid({
  wallpapers,
  selectedWallpaper,
  favorites,
  appliedWallpaperId,
  onSelect,
  onFavorite,
  viewMode,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
}: WallpaperGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, onLoadMore]);

  // Initial load skeleton
  if (isLoading) {
    return (
      <div
        className={viewMode === "grid" ? "grid gap-4 p-5" : "flex flex-col gap-2 p-5"}
        style={viewMode === "grid" ? { gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" } : {}}
      >
        <SkeletonGrid count={viewMode === "grid" ? 12 : 6} viewMode={viewMode} />
      </div>
    );
  }

  // Empty state
  if (wallpapers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24">
        <Wind size={44} style={{ color: "var(--wh-text-4)", opacity: 0.4 }} className="mb-4" />
        <p style={{ color: "var(--wh-text-3)", fontSize: "15px" }}>No wallpapers found</p>
        <p style={{ color: "var(--wh-text-4)", fontSize: "12px", marginTop: 6 }}>
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  const gridClass = viewMode === "grid"
    ? "grid gap-4 p-5"
    : "flex flex-col gap-2 p-5";

  const gridStyle = viewMode === "grid"
    ? { gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }
    : {};

  return (
    <div className={gridClass} style={gridStyle}>
      {wallpapers.map((wp) => (
        <WallpaperCard
          key={wp.id}
          wallpaper={wp}
          isSelected={selectedWallpaper?.id === wp.id}
          isFavorite={favorites.includes(wp.id)}
          isApplied={appliedWallpaperId === wp.id}
          onSelect={onSelect}
          onFavorite={onFavorite}
          viewMode={viewMode}
        />
      ))}

      {/* Loading more skeletons */}
      {isLoadingMore && (
        <SkeletonGrid count={viewMode === "grid" ? 6 : 3} viewMode={viewMode} />
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="w-full" style={{ height: "4px" }} />

      {/* End of results */}
      {!hasMore && wallpapers.length > 0 && (
        <div
          className={viewMode === "grid" ? "col-span-full text-center py-8" : "text-center py-8"}
        >
          <p style={{ color: "var(--wh-text-4)", fontSize: "12px" }}>
            All {wallpapers.length.toLocaleString()} wallpapers loaded
          </p>
        </div>
      )}

      {/* Load more indicator */}
      {isLoadingMore && !isLoading && (
        <div
          className={viewMode === "grid" ? "col-span-full flex justify-center py-4" : "flex justify-center py-4"}
        >
          <div className="flex items-center gap-2" style={{ color: "var(--wh-text-3)", fontSize: "12px" }}>
            <Loader2 size={14} className="animate-spin" />
            <span>Loading more...</span>
          </div>
        </div>
      )}
    </div>
  );
}
