"use client";

import React, { useState } from "react";
import { Undo2, Redo2, Eye, EyeOff, RotateCcw } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import ResetModal from "@/components/modals/reset-modal";

export default function LeftSidebar() {
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);
  const showOriginal = useEditorStore((s) => s.showOriginal);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const toggleShowOriginal = useEditorStore((s) => s.toggleShowOriginal);

  const [resetOpen, setResetOpen] = useState(false);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return (
    <>
      <aside className="w-16 shrink-0 flex flex-col items-center gap-1 py-6 border-r border-white/5">
        {/* Undo */}
        <SidebarButton
          icon={<Undo2 className="w-[18px] h-[18px]" />}
          label="Undo"
          disabled={!canUndo || showOriginal}
          onClick={undo}
        />

        {/* Redo */}
        <SidebarButton
          icon={<Redo2 className="w-[18px] h-[18px]" />}
          label="Redo"
          disabled={!canRedo || showOriginal}
          onClick={redo}
        />

        <div className="w-6 border-t border-white/10 my-2" />

        {/* Show Original Toggle */}
        <SidebarButton
          icon={
            showOriginal ? (
              <EyeOff className="w-[18px] h-[18px]" />
            ) : (
              <Eye className="w-[18px] h-[18px]" />
            )
          }
          label="Original"
          active={showOriginal}
          onClick={toggleShowOriginal}
        />

        <div className="w-6 border-t border-white/10 my-2" />

        {/* Reset */}
        <SidebarButton
          icon={<RotateCcw className="w-[18px] h-[18px]" />}
          label="Reset"
          disabled={showOriginal}
          onClick={() => setResetOpen(true)}
        />
      </aside>

      <ResetModal open={resetOpen} onClose={() => setResetOpen(false)} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Reusable sidebar button
// ---------------------------------------------------------------------------
function SidebarButton({
  icon,
  label,
  disabled,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`
        w-12 h-12 flex flex-col items-center justify-center gap-0.5 rounded-xl 
        transition-colors duration-200
        ${
          disabled
            ? "text-white/15 cursor-not-allowed"
            : active
            ? "bg-white/10 text-white"
            : "text-white/50 hover:text-white hover:bg-white/5"
        }
      `}
    >
      {icon}
      <span className="text-[9px] leading-none font-medium">{label}</span>
    </button>
  );
}
