export interface Wallpaper {
  id: string;
  url: string;
  thumbUrl: string;
  fullUrl: string;
  resolution: string;
  width: number;
  height: number;
  fileSize: string;
  category: "general" | "anime" | "people";
  purity: "sfw" | "sketchy";
  tags: string[];
  views: number;
  favorites: number;
  source: string;
  uploader: string;
  uploadedAt: string;
  colors: string[];
}

export type SortOption = "trending" | "date_added" | "views" | "favorites" | "random" | "toplist";
export type CategoryFilter = "general" | "anime" | "people";
export type ResolutionFilter = "all" | "1920x1080" | "2560x1440" | "3840x2160" | "1280x720" | "2560x1080";

export interface Filters {
  categories: CategoryFilter[];
  sorting: SortOption;
  resolution: ResolutionFilter;
  query: string;
}

export type NavView = "trending" | "latest" | "toplist" | "random" | "favorites" | "settings";