"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Crop,
  SlidersHorizontal,
  Download,
  Crown,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { getFilterConfig } from "@/config/filters";
import { renderThumbnailWithLut } from "@/lib/lut-engine";
import ExportModal from "@/components/modals/export-modal";
import {
  FilterConfig,
  FilterCategory,
  CssFilterDef,
  LutFilterDef,
} from "@/types";

// =============================================================================
// Tool sliders config
// =============================================================================
const TOOL_GROUPS = [
  {
    label: "Light",
    tools: [
      { id: "exposure", label: "Exposure", min: -100, max: 100 },
      { id: "contrast", label: "Contrast", min: -100, max: 100 },
      { id: "fade", label: "Fade", min: 0, max: 100 },
    ],
  },
  {
    label: "Color",
    tools: [
      { id: "saturation", label: "Saturation", min: -100, max: 100 },
      { id: "skinTone", label: "Skin Tone", min: -100, max: 100 },
      { id: "temperature", label: "Temperature", min: -100, max: 100 },
      { id: "tint", label: "Tint", min: -100, max: 100 },
    ],
  },
  {
    label: "Effects",
    tools: [{ id: "grain", label: "Grain", min: 0, max: 100 }],
  },
];

// =============================================================================
// Right Sidebar
// =============================================================================
export default function RightSidebar({ 
  activeSection, 
  setActiveSection 
}: { 
  activeSection: string; 
  setActiveSection: (s: string) => void;
}) {
  const present = useEditorStore((s) => s.present);
  const showOriginal = useEditorStore((s) => s.showOriginal);
  const originalImage = useEditorStore((s) => s.originalImage);

  const [exportOpen, setExportOpen] = useState(false);

  // Determine if current filter is pro (look it up from config or fallback)
  const isCurrentPro = false; // simplified — extend if needed

  return (
    <>
      <aside className="w-72 shrink-0 border-l border-white/5 flex flex-col overflow-hidden">
        {/* Section Tabs */}
        <div className="flex border-b border-white/5">
          <TabButton
            icon={<Sparkles className="w-4 h-4" />}
            label="Filters"
            active={activeSection === "filters"}
            onClick={() => setActiveSection("filters")}
          />
          <TabButton
            icon={<Crop className="w-4 h-4" />}
            label="Crop"
            active={activeSection === "crop"}
            onClick={() => setActiveSection("crop")}
          />
          <TabButton
            icon={<SlidersHorizontal className="w-4 h-4" />}
            label="Tools"
            active={activeSection === "tools"}
            onClick={() => setActiveSection("tools")}
          />
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
          {activeSection === "filters" && (
            <DynamicFiltersSection
              activeFilterId={present.filterId}
              disabled={showOriginal}
              previewImage={originalImage}
            />
          )}
          {activeSection === "crop" && <CropSection />}
          {activeSection === "tools" && <ToolsSection disabled={showOriginal} />}
        </div>

        {/* Export button */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => setExportOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-xl text-sm font-semibold
                       hover:bg-white/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
            {isCurrentPro && (
              <Crown className="w-3.5 h-3.5 text-amber-500" />
            )}
          </button>
        </div>
      </aside>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  );
}

// =============================================================================
// Dynamic Filters Section — driven by filterConfig.json
// =============================================================================
function DynamicFiltersSection({
  activeFilterId,
  disabled,
  previewImage,
}: {
  activeFilterId: string;
  disabled: boolean;
  previewImage: string | null;
}) {
  const [config, setConfig] = useState<FilterConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFilterConfig()
      .then(setConfig)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-red-400/70">
        <AlertCircle className="w-6 h-6" />
        <p className="text-xs text-center">Failed to load filters</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((j) => (
                <div key={j} className="aspect-square rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {config.categories.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          activeFilterId={activeFilterId}
          disabled={disabled}
          previewImage={previewImage}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Category Section (collapsible)
// =============================================================================
function CategorySection({
  category,
  activeFilterId,
  disabled,
  previewImage,
}: {
  category: FilterCategory;
  activeFilterId: string;
  disabled: boolean;
  previewImage: string | null;
}) {
  // Presets default open, others collapsed
  const [open, setOpen] = useState(category.id === "presets");

  return (
    <div className="category-section">
      {/* Category Header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2.5 text-[11px] uppercase tracking-widest text-white/40 font-semibold hover:text-white/70 transition-colors"
      >
        <span className="flex items-center gap-2">
          {category.name}
          <span className="text-[9px] lowercase tracking-normal text-white/20 font-normal">
            {category.filters.length}
          </span>
        </span>
        {open ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {/* Filter Grid */}
      {open && (
        <div className="grid grid-cols-3 gap-2 pb-3">
          {category.type === "css"
            ? (category.filters as CssFilterDef[]).map((filter) => (
                <CssFilterButton
                  key={filter.id}
                  filter={filter}
                  isActive={filter.id === activeFilterId}
                  disabled={disabled}
                  previewImage={previewImage}
                />
              ))
            : (category.filters as LutFilterDef[]).map((filter) => (
                <LutFilterButton
                  key={filter.id}
                  filter={filter}
                  isActive={filter.id === activeFilterId}
                  disabled={disabled}
                  previewImage={previewImage}
                />
              ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CSS Filter Button
// =============================================================================
function CssFilterButton({
  filter,
  isActive,
  disabled,
  previewImage,
}: {
  filter: CssFilterDef;
  isActive: boolean;
  disabled: boolean;
  previewImage: string | null;
}) {
  const applyCssFilter = useEditorStore((s) => s.applyCssFilter);

  return (
    <button
      disabled={disabled}
      onClick={() => applyCssFilter(filter.id, filter.cssFilter)}
      className={`
        group relative flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition-all duration-200
        ${disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5 cursor-pointer"}
        ${isActive ? "ring-1 ring-white/30 bg-white/5" : ""}
      `}
    >
      <div className="w-full aspect-square rounded-lg overflow-hidden bg-white/5">
        {previewImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewImage}
            alt={filter.label}
            className="w-full h-full object-cover"
            style={{ filter: filter.cssFilter }}
          />
        )}
      </div>
      <span className="text-[10px] font-medium text-white/60 group-hover:text-white/90 transition-colors flex items-center gap-1">
        {filter.label}
        {filter.isPro && <Crown className="w-3 h-3 text-amber-500" />}
      </span>
    </button>
  );
}

// =============================================================================
// LUT Filter Button
// =============================================================================
function LutFilterButton({
  filter,
  isActive,
  disabled,
  previewImage,
}: {
  filter: LutFilterDef;
  isActive: boolean;
  disabled: boolean;
  previewImage: string | null;
}) {
  const applyLutFilter = useEditorStore((s) => s.applyLutFilter);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Generate LUT preview thumbnail
  useEffect(() => {
    if (!previewImage || thumbnail) return;

    let cancelled = false;
    
    // Use a small delay to avoid "Calling setState synchronously within an effect" warning
    // or better, just start the async operation which will set loading to false when done.
    // We can assume it's loading if we have previewImage but no thumbnail.
    
    renderThumbnailWithLut(previewImage, filter.path)
      .then((result) => {
        if (!cancelled) {
          setThumbnail(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [previewImage, filter.path, thumbnail]);

  const handleClick = useCallback(() => {
    if (error) return;
    applyLutFilter(filter.id, filter.path);
  }, [applyLutFilter, filter.id, filter.path, error]);

  return (
    <button
      disabled={disabled || error}
      onClick={handleClick}
      className={`
        group relative flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition-all duration-200
        ${disabled || error ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5 cursor-pointer"}
        ${isActive ? "ring-1 ring-white/30 bg-white/5" : ""}
      `}
    >
      <div className="w-full aspect-square rounded-lg overflow-hidden bg-white/5 relative">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-red-400/50" />
          </div>
        ) : loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
          </div>
        ) : thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={filter.label}
            className="w-full h-full object-cover"
          />
        ) : previewImage ? (
          // Fallback: show original while thumbnail is generated
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewImage}
            alt={filter.label}
            className="w-full h-full object-cover opacity-50"
          />
        ) : null}
      </div>
      <span className="text-[10px] font-medium text-white/60 group-hover:text-white/90 transition-colors flex items-center gap-1">
        {filter.label}
        {error && <AlertCircle className="w-3 h-3 text-red-400/50" />}
        {filter.isPro && <Crown className="w-3 h-3 text-amber-500" />}
      </span>
    </button>
  );
}

// =============================================================================
// Crop Section
// =============================================================================
const ASPECT_RATIOS = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 / 1 },
  { label: "4:5", value: 4 / 5 },
  { label: "3:4", value: 3 / 4 },
  { label: "2:3", value: 2 / 3 },
  { label: "9:16", value: 9 / 16 },
  { label: "5:4", value: 5 / 4 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
];

function CropSection() {
  const aspectRatio = useEditorStore((s) => s.present.aspectRatio);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);

  return (
    <div className="space-y-4">
      <h3 className="text-[11px] uppercase tracking-widest text-white/30 font-semibold">
        Aspect Ratio
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {ASPECT_RATIOS.map((ratio) => (
          <button
            key={ratio.label}
            onClick={() => setAspectRatio(ratio.value)}
            className={`
              py-2 px-1 rounded-lg text-[10px] font-medium transition-all
              ${
                aspectRatio === ratio.value
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }
            `}
          >
            {ratio.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Tools Section (Visual Only — sliders do not affect image)
// =============================================================================
function ToolsSection({ disabled }: { disabled: boolean }) {
  return (
    <div className="space-y-4">
      {TOOL_GROUPS.map((group) => (
        <ToolGroup
          key={group.label}
          label={group.label}
          tools={group.tools}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

function ToolGroup({
  label,
  tools,
  disabled,
}: {
  label: string;
  tools: { id: string; label: string; min: number; max: number }[];
  disabled: boolean;
}) {
  const [open, setOpen] = useState(true);
  const adjustments = useEditorStore((s) => s.present.adjustments);
  const updateAdjustment = useEditorStore((s) => s.updateAdjustment);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-[11px] uppercase tracking-widest text-white/30 font-semibold mb-2 hover:text-white/50 transition-colors"
      >
        {label}
        {open ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>
      {open && (
        <div className="space-y-3">
          {tools.map((tool) => {
            const val = adjustments[tool.id as keyof typeof adjustments] ?? 0;
            return (
              <div key={tool.id} className={disabled ? "opacity-30" : ""}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/50">{tool.label}</span>
                  <span className="text-[10px] text-white/25 tabular-nums">
                    {val > 0 ? `+${val}` : val}
                  </span>
                </div>
                <input
                  type="range"
                  min={tool.min}
                  max={tool.max}
                  value={val}
                  onChange={(e) =>
                    updateAdjustment(
                      tool.id as keyof typeof adjustments,
                      parseInt(e.target.value)
                    )
                  }
                  disabled={disabled}
                  className="studio-slider w-full"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Tab Button
// =============================================================================
function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors
        ${active ? "text-white border-b-2 border-white" : "text-white/40 hover:text-white/70"}
      `}
    >
      {icon}
      {label}
    </button>
  );
}
