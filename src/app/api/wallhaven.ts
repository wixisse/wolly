import { Wallpaper, Filters, SortOption } from "../types";

// ─── API Types ────────────────────────────────────────────────────────────────

export interface WHWallpaper {
  id: string;
  url: string;
  short_url: string;
  views: number;
  favorites: number;
  source: string;
  purity: "sfw" | "sketchy" | "nsfw";
  category: "general" | "anime" | "people";
  dimension_x: number;
  dimension_y: number;
  resolution: string;
  ratio: string;
  file_size: number;
  file_type: string;
  created_at: string;
  colors: string[];
  path: string;
  thumbs: {
    large: string;
    original: string;
    small: string;
  };
  tags?: Array<{
    id: number;
    name: string;
    alias: string;
    category_id: number;
    category: string;
    purity: string;
    created_at: string;
  }>;
  uploader?: {
    username: string;
    group: string;
    avatar: Record<string, string>;
  };
}

export interface WHMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  query: string | null;
  seed: string | null;
}

export interface WHResponse {
  data: WHWallpaper[];
  meta: WHMeta;
}

export interface SearchParams {
  filters: Filters;
  view: string;
  page: number;
  apiKey?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBytes(n: number): string {
  if (!n) return "Unknown";
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function categoriesBitmask(cats: string[]): string {
  return [
    cats.includes("general") ? "1" : "0",
    cats.includes("anime") ? "1" : "0",
    cats.includes("people") ? "1" : "0",
  ].join("");
}

const SORT_MAP: Record<SortOption, string> = {
  trending: "hot",
  date_added: "date_added",
  views: "views",
  favorites: "favorites",
  random: "random",
  toplist: "toplist",
};

const RESOLUTION_MAP: Record<string, string | null> = {
  all: null,
  "1920x1080": "1920x1080",
  "2560x1440": "2560x1440",
  "3840x2160": "3840x2160",
  "2560x1080": "2560x1080",
  "1280x720": "1280x720",
};

// ─── Mapper ──────────────────────────────────────────────────────────────────

export function mapWH(item: WHWallpaper): Wallpaper {
  const tags = item.tags?.map((t) => t.name) ?? [item.category];
  const category =
    item.category === "anime" || item.category === "people"
      ? item.category
      : "general";

  return {
    id: item.id,
    url: item.path,
    thumbUrl: item.thumbs.large,
    fullUrl: item.path,
    resolution: item.resolution,
    width: item.dimension_x,
    height: item.dimension_y,
    fileSize: fmtBytes(item.file_size),
    category,
    purity: item.purity === "sfw" ? "sfw" : "sketchy",
    tags: tags.slice(0, 8),
    views: item.views,
    favorites: item.favorites,
    source: item.url,
    uploader: item.uploader?.username ?? "Anonymous",
    uploadedAt: item.created_at.split(" ")[0],
    colors: item.colors.slice(0, 6),
  };
}

// ─── Fetcher ─────────────────────────────────────────────────────────────────

const BASE = "https://wallhaven.cc/api/v1/search";
// Proxy for CORS since wallhaven doesn't expose CORS headers for browser requests
const PROXY = "https://corsproxy.io/?";

async function fetchJSON(url: URL): Promise<WHResponse> {
  // Try direct first
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (_e) {
    // Fall back to CORS proxy
    res = await fetch(PROXY + encodeURIComponent(url.toString()), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }
}

export async function searchWallhaven(params: SearchParams): Promise<WHResponse> {
  const url = new URL(BASE);

  // Categories — never send "000", fallback to "111"
  const catBits = categoriesBitmask(params.filters.categories);
  url.searchParams.set("categories", catBits === "000" ? "111" : catBits);

  // Purity (SFW only for no API key; allow sketchy with key)
  url.searchParams.set("purity", params.apiKey?.trim() ? "110" : "100");

  // Sorting — named view overrides filter
  const viewSortMap: Record<string, string> = {
    trending: "hot",
    latest:   "date_added",
    toplist:  "toplist",
    random:   "random",
  };
  const sorting =
    viewSortMap[params.view] ?? SORT_MAP[params.filters.sorting as SortOption] ?? "hot";
  url.searchParams.set("sorting", sorting);
  url.searchParams.set("order", "desc");

  // Search query
  if (params.filters.query.trim()) {
    url.searchParams.set("q", params.filters.query.trim());
  }

  // Resolution filter (atleast = minimum resolution)
  const atleast = RESOLUTION_MAP[params.filters.resolution];
  if (atleast) url.searchParams.set("atleast", atleast);

  // Pagination
  url.searchParams.set("page", String(params.page));

  // API key
  if (params.apiKey?.trim()) {
    url.searchParams.set("apikey", params.apiKey.trim());
  }

  return fetchJSON(url);
}