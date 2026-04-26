"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, Loader2, Crown, ChevronDown, ChevronUp } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { getFilterConfig } from "@/config/filters";
import { renderThumbnailWithLut } from "@/lib/lut-engine";
import {
  FilterConfig,
  FilterCategory,
  CssFilterDef,
  LutFilterDef,
} from "@/types";

export default function FiltersSection({
  disabled,
  previewImage,
}: {
  disabled: boolean;
  previewImage: string | null;
}) {
  const activeFilterId = useEditorStore((s) => s.present.filterId);
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
  const [open, setOpen] = useState(category.id === "presets");

  return (
    <div className="category-section">
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

  useEffect(() => {
    if (!previewImage || thumbnail) return;

    let cancelled = false;
    
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
