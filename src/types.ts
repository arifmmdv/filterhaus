// =============================================================================
// Photo Studio — Core Types & Interfaces
// =============================================================================

// ---------------------------------------------------------------------------
// Filter Config (loaded from filterConfig.json)
// ---------------------------------------------------------------------------

/** A CSS-based filter definition (Presets category) */
export interface CssFilterDef {
  id: string;
  label: string;
  cssFilter: string;
  isPro: boolean;
}

/** A LUT-based filter definition (Fashion, Vintage, etc.) */
export interface LutFilterDef {
  id: string;
  label: string;
  path: string;
  isPro?: boolean;
}

/** A filter category from the config */
export interface FilterCategory {
  id: string;
  name: string;
  type: "css" | "lut";
  filters: CssFilterDef[] | LutFilterDef[];
}

/** Root shape of filterConfig.json */
export interface FilterConfig {
  categories: FilterCategory[];
}

/** Type guard helpers */
export function isCssFilter(f: CssFilterDef | LutFilterDef): f is CssFilterDef {
  return "cssFilter" in f;
}
export function isLutFilter(f: CssFilterDef | LutFilterDef): f is LutFilterDef {
  return "path" in f;
}

// ---------------------------------------------------------------------------
// Legacy flat Filter type (still used by getFilterById for CSS filters)
// ---------------------------------------------------------------------------

/** A single filter definition. `isPro` is reserved for future premium gating. */
export interface Filter {
  id: string;
  name: string;
  /** CSS `filter` value applied to the image element */
  cssFilter: string;
  /** Whether this filter requires a Pro subscription */
  isPro: boolean;
}

// ---------------------------------------------------------------------------
// Parsed LUT Data
// ---------------------------------------------------------------------------

import { LutData } from "@/lib/lutParser";
export type { LutData };

// ---------------------------------------------------------------------------
// Editor State
// ---------------------------------------------------------------------------

/** Slider-based adjustment (non-functional for v1, but typed for scalability) */
export interface Adjustments {
  exposure: number;
  contrast: number;
  fade: number;
  saturation: number;
  skinTone: number;
  temperature: number;
  tint: number;
  grain: number;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: "px" | "%";
}

/** The present state of the editor at any point in time */
export interface EditorSnapshot {
  filterId: string;
  /** Discriminator: tells the canvas how to render */
  filterType: "css" | "lut";
  /** Populated only when filterType === "css" */
  cssFilter: string;
  /** Populated only when filterType === "lut" */
  lutPath: string;
  adjustments: Adjustments;
  crop?: CropArea;
  aspectRatio?: number;
}

/** Full editor store state */
export interface EditorState {
  /** Base64 data-url of the originally uploaded image */
  originalImage: string | null;
  /** Whether the "Show Original" toggle is active */
  showOriginal: boolean;
  /** Undo stack */
  past: EditorSnapshot[];
  /** Current editing state */
  present: EditorSnapshot;
  /** Redo stack */
  future: EditorSnapshot[];
  /** Cached LUT-rendered data URLs keyed by filter id */
  lutImageCache: Record<string, string>;
  /** Filter IDs currently being processed */
  lutLoading: Set<string>;
}

  /** Actions available on the editor store */
export interface EditorActions {
  setImage: (dataUrl: string) => void;
  applyCssFilter: (filterId: string, cssFilter: string) => void;
  applyLutFilter: (filterId: string, lutPath: string) => void;
  updateAdjustment: (key: keyof Adjustments, value: number) => void;
  setCrop: (crop: CropArea | undefined) => void;
  setAspectRatio: (ratio: number | undefined) => void;
  setLutResult: (filterId: string, dataUrl: string) => void;
  setLutLoading: (filterId: string, loading: boolean) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  toggleShowOriginal: () => void;
  clearSession: () => void;
}

export type EditorStore = EditorState & EditorActions;
