"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { Adjustments } from "@/types";

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

export default function ToolsSection({ disabled }: { disabled: boolean }) {
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
            const val = adjustments[tool.id as keyof Adjustments] ?? 0;
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
                      tool.id as keyof Adjustments,
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
