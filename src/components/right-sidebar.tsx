"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Crop,
  SlidersHorizontal,
  Download,
  Crown,
} from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import ExportModal from "@/components/modals/export-modal";

import FiltersSection from "./sidebar-sections/filters-section";
import CropSection from "./sidebar-sections/crop-section";
import ToolsSection from "./sidebar-sections/tools-section";

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
            <FiltersSection
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
