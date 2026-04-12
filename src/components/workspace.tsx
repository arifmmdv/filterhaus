"use client";

import React from "react";
import LeftSidebar from "@/components/left-sidebar";
import CenterCanvas from "@/components/center-canvas";
import RightSidebar from "@/components/right-sidebar";

export default function Workspace() {
  return (
    <div className="flex-1 flex overflow-hidden">
      <LeftSidebar />
      <CenterCanvas />
      <RightSidebar />
    </div>
  );
}
