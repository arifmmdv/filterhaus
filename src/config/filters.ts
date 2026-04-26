import { Filter, FilterConfig } from "@/types";

// =============================================================================
// Filter Config Loader
// Fetches the centralised filterConfig.json and provides helpers.
// =============================================================================

let configCache: FilterConfig | null = null;

/**
 * Fetch and cache the filter configuration.
 */
export async function getFilterConfig(): Promise<FilterConfig> {
  if (configCache) return configCache;

  const res = await fetch("/filterConfig.json");
  if (!res.ok) throw new Error("Failed to load filter config");
  configCache = (await res.json()) as FilterConfig;
  return configCache;
}

// =============================================================================
// Legacy helpers (used by CSS-filter code paths)
// =============================================================================

/** Build a flat list of CSS-type filters from the config (synchronous fallback) */
export const FILTERS: Filter[] = [
  { id: "none", name: "None", cssFilter: "none", isPro: false },
  { id: "grayscale", name: "Grayscale", cssFilter: "grayscale(100%)", isPro: false },
  {
    id: "moody",
    name: "Moody",
    cssFilter: "saturate(0.6) contrast(1.35) brightness(0.8) sepia(0.15)",
    isPro: false,
  },
  {
    id: "happy",
    name: "Happy",
    cssFilter: "saturate(1.4) brightness(1.1) contrast(1.05) hue-rotate(10deg)",
    isPro: false,
  },
];

/** Lookup helper (CSS filters only) */
export function getFilterById(id: string): Filter {
  return FILTERS.find((f) => f.id === id) ?? FILTERS[0];
}

/**
 * Get filter metadata from the loaded config.
 */
export function findFilterInConfig(config: FilterConfig, id: string) {
  for (const cat of config.categories) {
    const found = cat.filters.find((f) => f.id === id);
    if (found) return { ...found, categoryType: cat.type };
  }
  return null;
}
