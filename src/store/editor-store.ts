import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EditorStore, EditorSnapshot, Adjustments, CropArea } from "@/types";

// =============================================================================
// Defaults
// =============================================================================

const DEFAULT_ADJUSTMENTS: Adjustments = {
  exposure: 0,
  contrast: 0,
  fade: 0,
  saturation: 0,
  skinTone: 0,
  temperature: 0,
  tint: 0,
  grain: 0,
};

const DEFAULT_SNAPSHOT: EditorSnapshot = {
  filterId: "none",
  filterType: "css",
  cssFilter: "none",
  lutPath: "",
  adjustments: { ...DEFAULT_ADJUSTMENTS },
};

// =============================================================================
// Zustand Store with localStorage persistence & undo/redo
// =============================================================================

export const useEditorStore = create<EditorStore>()(
  persist(
    (set) => ({
      // ---- State ----
      originalImage: null,
      showOriginal: false,
      past: [],
      present: { ...DEFAULT_SNAPSHOT },
      future: [],
      lutImageCache: {},
      lutLoading: new Set<string>(),

      // ---- Actions ----
      setImage: (dataUrl: string) =>
        set({
          originalImage: dataUrl,
          showOriginal: false,
          past: [],
          present: { ...DEFAULT_SNAPSHOT },
          future: [],
          lutImageCache: {},
          lutLoading: new Set(),
        }),

      /** Apply a CSS-based filter (Presets) */
      applyCssFilter: (filterId: string, cssFilter: string) =>
        set((state) => {
          const newSnapshot: EditorSnapshot = {
            ...state.present,
            filterId,
            filterType: "css",
            cssFilter,
            lutPath: "",
          };
          return {
            past: [...state.past, state.present],
            present: newSnapshot,
            future: [],
          };
        }),

      /** Apply a LUT-based filter (Fashion, etc.) */
      applyLutFilter: (filterId: string, lutPath: string) =>
        set((state) => {
          const newSnapshot: EditorSnapshot = {
            ...state.present,
            filterId,
            filterType: "lut",
            cssFilter: "none",
            lutPath,
          };
          return {
            past: [...state.past, state.present],
            present: newSnapshot,
            future: [],
          };
        }),

      /** Update a single adjustment value */
      updateAdjustment: (key: keyof Adjustments, value: number) =>
        set((state) => {
          const newAdjustments = {
            ...state.present.adjustments,
            [key]: value,
          };
          const newSnapshot: EditorSnapshot = {
            ...state.present,
            adjustments: newAdjustments,
          };
          return {
            past: [...state.past, state.present],
            present: newSnapshot,
            future: [],
          };
        }),

      setCrop: (crop: CropArea | undefined) =>
        set((state) => ({
          past: [...state.past, state.present],
          present: { ...state.present, crop },
          future: [],
        })),

      setAspectRatio: (aspectRatio: number | undefined) =>
        set((state) => ({
          past: [...state.past, state.present],
          present: { ...state.present, aspectRatio },
          future: [],
        })),

      /** Cache a rendered LUT result */
      setLutResult: (filterId: string, dataUrl: string) =>
        set((state) => ({
          lutImageCache: { ...state.lutImageCache, [filterId]: dataUrl },
        })),

      /** Toggle loading state for a LUT filter */
      setLutLoading: (filterId: string, loading: boolean) =>
        set((state) => {
          const next = new Set(state.lutLoading);
          if (loading) next.add(filterId);
          else next.delete(filterId);
          return { lutLoading: next };
        }),

      undo: () =>
        set((state) => {
          if (state.past.length === 0) return state;
          const previous = state.past[state.past.length - 1];
          const newPast = state.past.slice(0, -1);
          return {
            past: newPast,
            present: previous,
            future: [state.present, ...state.future],
          };
        }),

      redo: () =>
        set((state) => {
          if (state.future.length === 0) return state;
          const next = state.future[0];
          const newFuture = state.future.slice(1);
          return {
            past: [...state.past, state.present],
            present: next,
            future: newFuture,
          };
        }),

      reset: () =>
        set({
          past: [],
          present: { ...DEFAULT_SNAPSHOT },
          future: [],
          showOriginal: false,
        }),

      toggleShowOriginal: () =>
        set((state) => ({ showOriginal: !state.showOriginal })),

      clearSession: () =>
        set({
          originalImage: null,
          showOriginal: false,
          past: [],
          present: { ...DEFAULT_SNAPSHOT },
          future: [],
          lutImageCache: {},
          lutLoading: new Set(),
        }),
    }),
    {
      name: "photo-studio-editor",
      partialize: (state) => ({
        originalImage: state.originalImage,
        showOriginal: state.showOriginal,
        past: state.past,
        present: state.present,
        future: state.future,
        // Don't persist lutImageCache and lutLoading (runtime only)
      }),
    }
  )
);
