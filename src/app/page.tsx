"use client";

import React from "react";
import { Camera, LogOut } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import Landing from "@/components/landing";
import Workspace from "@/components/workspace";

export default function HomePage() {
  const [mounted, setMounted] = React.useState(false);
  const originalImage = useEditorStore((s) => s.originalImage);
  const clearSession = useEditorStore((s) => s.clearSession);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="h-screen flex flex-col bg-black text-white overflow-hidden">
        <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <Camera className="w-5 h-5 text-white/70" />
            <span className="text-sm font-semibold tracking-wide text-white/80">
              Photo Studio
            </span>
          </div>
        </header>
        <div className="flex-1" />
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Top bar */}
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <Camera className="w-5 h-5 text-white/70" />
          <span className="text-sm font-semibold tracking-wide text-white/80">
            Photo Studio
          </span>
        </div>

        {originalImage && (
          <button
            onClick={clearSession}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            New Photo
          </button>
        )}
      </header>

      {/* Content — Landing or Workspace */}
      {originalImage ? <Workspace /> : <Landing />}
    </main>
  );
}
