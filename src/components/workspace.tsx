"use client";

import React, { useState } from "react";
import LeftSidebar from "@/components/left-sidebar";
import CenterCanvas from "@/components/center-canvas";
import RightSidebar from "@/components/right-sidebar";
import AdSense from "@/components/adsense";

export default function Workspace() {
  const [activeSection, setActiveSection] = useState("filters");

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <AdSense
        className="portrait:flex landscape:hidden w-full h-20 shrink-0 border-b border-white/5" 
        slot="mobile-top"
      />

      <div className="flex-1 flex overflow-hidden">
        <AdSense
          className="hidden landscape:flex w-24 shrink-0 border-r border-white/5" 
          slot="left-sidebar-ad"
        />

        <LeftSidebar />

        <CenterCanvas activeSection={activeSection} />

        <RightSidebar activeSection={activeSection} setActiveSection={setActiveSection} />

        <AdSense
          className="hidden landscape:flex w-24 shrink-0 border-l border-white/5" 
          slot="right-sidebar-ad"
        />
      </div>

      <AdSense
        className="portrait:flex landscape:hidden w-full h-20 shrink-0 border-t border-white/5" 
        slot="mobile-bottom"
      />
    </div>
  );
}
