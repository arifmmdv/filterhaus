"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";

interface ResetModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ResetModal({ open, onClose }: ResetModalProps) {
  const reset = useEditorStore((s) => s.reset);

  if (!open) return null;

  const handleConfirm = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Reset all edits?
            </h3>
            <p className="text-xs text-white/50 leading-relaxed">
              This will discard your entire edit history and revert the photo to
              its original state. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
