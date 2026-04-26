"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import { useEditorStore } from "@/store/editor-store";
import { renderImageWithLut } from "@/lib/lut-engine";
import { getCombinedFilter } from "@/lib/filters";
import CropOverlay from "./crop-overlay";

export default function CenterCanvas({ activeSection }: { activeSection?: string }) {
  const originalImage = useEditorStore((s) => s.originalImage);
  const present = useEditorStore((s) => s.present);
  const showOriginal = useEditorStore((s) => s.showOriginal);
  const lutImageCache = useEditorStore((s) => s.lutImageCache);
  const setLutResult = useEditorStore((s) => s.setLutResult);
  const setLutLoading = useEditorStore((s) => s.setLutLoading);
  const lutLoading = useEditorStore((s) => s.lutLoading);
  const setCrop = useEditorStore((s) => s.setCrop);
  
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageSize({
      width: e.currentTarget.naturalWidth,
      height: e.currentTarget.naturalHeight,
    });
  };

  // Auto-render LUT when a LUT filter is selected and not yet cached
  const renderLut = useCallback(async () => {
    if (
      present.filterType !== "lut" ||
      !present.lutPath ||
      !originalImage ||
      lutImageCache[present.filterId]
    ) {
      return;
    }

    setLutLoading(present.filterId, true);
    try {
      const result = await renderImageWithLut(originalImage, present.lutPath);
      setLutResult(present.filterId, result);
    } catch (err) {
      console.error("LUT render failed:", err);
    } finally {
      setLutLoading(present.filterId, false);
    }
  }, [present.filterType, present.lutPath, present.filterId, originalImage, lutImageCache, setLutResult, setLutLoading]);

  useEffect(() => {
    renderLut();
  }, [renderLut]);

  if (!originalImage) return null;

  // Determine what to show
  const isLut = present.filterType === "lut" && !showOriginal;
  const lutResult = isLut ? lutImageCache[present.filterId] : null;
  const isLutRendering = isLut && !lutResult && lutLoading.has(present.filterId);

  const displaySrc = showOriginal
    ? originalImage
    : isLut && lutResult
    ? lutResult
    : originalImage;

  const cssFilter = showOriginal
    ? "none"
    : getCombinedFilter(
        present.filterType === "lut" ? "none" : present.cssFilter,
        present.adjustments
      );

  const isCropView = activeSection === "crop";

  const cropStyle: React.CSSProperties = !isCropView && present.crop ? {
    clipPath: `inset(${present.crop.y}% ${100 - (present.crop.x + present.crop.width)}% ${100 - (present.crop.y + present.crop.height)}% ${present.crop.x}%)`,
    transform: `scale(${100 / present.crop.width}, ${100 / present.crop.height})`,
    transformOrigin: `${present.crop.x + present.crop.width / 2}% ${present.crop.y + present.crop.height / 2}%`,
  } : {};

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-w-0 overflow-hidden">
      <div className="relative max-w-full max-h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={displaySrc}
          alt="Editing preview"
          onLoad={handleImageLoad}
          className="max-w-full max-h-[calc(100vh-6rem)] object-contain rounded-lg transition-[filter] duration-300"
          style={{ filter: cssFilter, ...cropStyle }}
        />

        {isCropView && (
          <CropOverlay
            imageWidth={imageSize.width}
            imageHeight={imageSize.height}
            crop={present.crop}
            aspectRatio={present.aspectRatio}
            onCropChange={setCrop}
          />
        )}

        {/* LUT loading overlay */}
        {isLutRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span className="text-xs text-white/70">Applying filter…</span>
            </div>
          </div>
        )}

        {/* Show Original badge */}
        {showOriginal && (
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full text-xs font-medium text-white/80 border border-white/10">
            Original
          </div>
        )}
      </div>
    </div>
  );
}
