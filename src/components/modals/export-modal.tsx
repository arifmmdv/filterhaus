"use client";

import React, { useCallback } from "react";
import { Download, Crown, X } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { getFilterById } from "@/config/filters";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ExportModal({ open, onClose }: ExportModalProps) {
  const originalImage = useEditorStore((s) => s.originalImage);
  const present = useEditorStore((s) => s.present);

  const activeFilter = getFilterById(present.filterId);

  const handleDownload = useCallback(() => {
    if (!originalImage) return;

    // Log isPro status
    if (activeFilter.isPro) {
      console.log(
        `[Photo Studio] Exporting with Pro filter: "${activeFilter.name}". Payment gating not yet implemented.`
      );
    }

    // Create an off-screen canvas to bake the CSS filter into pixels
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.filter = activeFilter.cssFilter;
      ctx.drawImage(img, 0, 0);

      const link = document.createElement("a");
      link.download = `photo-studio-export.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = originalImage;

    onClose();
  }, [originalImage, activeFilter, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
            <Download className="w-6 h-6 text-white/60" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">
            Export Photo
          </h3>
          <p className="text-xs text-white/40">
            Download the full-size image with your edits applied.
          </p>
        </div>

        {/* Pro filter badge */}
        {activeFilter.isPro && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs text-amber-200/80">
              This export uses the <strong>{activeFilter.name}</strong> Pro
              filter.
            </span>
          </div>
        )}

        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-xl text-sm font-semibold
                     hover:bg-white/90 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Full Size
        </button>
      </div>
    </div>
  );
}
