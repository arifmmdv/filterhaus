"use client";

import React from "react";
import { useEditorStore } from "@/store/editor-store";

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

export default function CropSection() {
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
