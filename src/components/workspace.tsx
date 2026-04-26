"use client";

import React, { useState } from "react";
import LeftSidebar from "@/components/left-sidebar";
import CenterCanvas from "@/components/center-canvas";
import RightSidebar from "@/components/right-sidebar";

export default function Workspace() {
  const [activeSection, setActiveSection] = useState("filters");

  return (
    <div className="flex-1 flex overflow-hidden">
      <LeftSidebar />
      <CenterCanvas activeSection={activeSection} />
      <RightSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
    </div>
  );
}
