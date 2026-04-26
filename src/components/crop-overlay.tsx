"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { CropArea } from "@/types";

interface CropOverlayProps {
  imageWidth: number;
  imageHeight: number;
  crop?: CropArea;
  aspectRatio?: number;
  onCropChange: (crop: CropArea) => void;
}

export default function CropOverlay({
  imageWidth,
  imageHeight,
  crop,
  aspectRatio,
  onCropChange,
}: CropOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startCrop, setStartCrop] = useState<CropArea | null>(null);

  // Initialize crop if not present
  useEffect(() => {
    if (!crop && imageWidth > 0 && imageHeight > 0) {
      let initialWidth = 80;
      let initialHeight = 80;
      
      if (aspectRatio) {
        const imageAspect = imageWidth / imageHeight;
        if (aspectRatio > imageAspect) {
          initialWidth = 80;
          initialHeight = (80 / aspectRatio) * imageAspect;
        } else {
          initialHeight = 80;
          initialWidth = (80 * aspectRatio) / imageAspect;
        }
      }

      onCropChange({
        x: (100 - initialWidth) / 2,
        y: (100 - initialHeight) / 2,
        width: initialWidth,
        height: initialHeight,
        unit: "%",
      });
    }
  }, [crop, imageWidth, imageHeight, aspectRatio, onCropChange]);

  // Handle aspect ratio change
  useEffect(() => {
    if (crop && aspectRatio && imageWidth > 0 && imageHeight > 0) {
      const imageAspect = imageWidth / imageHeight;
      let newWidth = crop.width;
      let newHeight = (crop.width / aspectRatio) * imageAspect;

      if (newHeight > 100 - crop.y) {
        newHeight = 100 - crop.y;
        newWidth = (newHeight * aspectRatio) / imageAspect;
      }
      
      if (newWidth > 100 - crop.x) {
        newWidth = 100 - crop.x;
        newHeight = (newWidth / aspectRatio) * imageAspect;
      }

      onCropChange({
        ...crop,
        width: newWidth,
        height: newHeight,
      });
    }
  }, [aspectRatio, imageWidth, imageHeight]);

  const handleMouseDown = (e: React.MouseEvent, type: string) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartCrop(crop ? { ...crop } : null);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !startCrop || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - startPos.x) / rect.width) * 100;
      const dy = ((e.clientY - startPos.y) / rect.height) * 100;

      let newCrop = { ...startCrop };
      const imageAspect = imageWidth / imageHeight;

      if (dragType === "move") {
        newCrop.x = Math.max(0, Math.min(100 - startCrop.width, startCrop.x + dx));
        newCrop.y = Math.max(0, Math.min(100 - startCrop.height, startCrop.y + dy));
      } else {
        // Resizing
        let nw = startCrop.width;
        let nh = startCrop.height;
        let nx = startCrop.x;
        let ny = startCrop.y;

        if (dragType?.includes("right")) nw = Math.max(5, Math.min(100 - nx, startCrop.width + dx));
        if (dragType?.includes("bottom")) nh = Math.max(5, Math.min(100 - ny, startCrop.height + dy));
        if (dragType?.includes("left")) {
          const possibleDx = Math.min(dx, startCrop.width - 5);
          nw = startCrop.width - possibleDx;
          nx = Math.max(0, startCrop.x + possibleDx);
          nw = startCrop.x + startCrop.width - nx;
        }
        if (dragType?.includes("top")) {
          const possibleDy = Math.min(dy, startCrop.height - 5);
          nh = startCrop.height - possibleDy;
          ny = Math.max(0, startCrop.y + possibleDy);
          nh = startCrop.y + startCrop.height - ny;
        }

        if (aspectRatio) {
          // Maintain aspect ratio while resizing
          if (dragType === "right" || dragType === "left") {
             nh = (nw / aspectRatio) * imageAspect;
          } else if (dragType === "bottom" || dragType === "top") {
             nw = (nh * aspectRatio) / imageAspect;
          } else {
            // Corners
            const targetAspect = aspectRatio / imageAspect;
            if (nw / nh > targetAspect) {
               nw = nh * targetAspect;
            } else {
               nh = nw / targetAspect;
            }
          }
          
          // Re-adjust x/y if resizing from top/left
          if (dragType?.includes("left")) nx = startCrop.x + startCrop.width - nw;
          if (dragType?.includes("top")) ny = startCrop.y + startCrop.height - nh;

          // Bounds check
          if (nx < 0) { nx = 0; nw = startCrop.x + startCrop.width; nh = (nw / aspectRatio) * imageAspect; }
          if (ny < 0) { ny = 0; nh = startCrop.y + startCrop.height; nw = (nh * aspectRatio) / imageAspect; }
          if (nx + nw > 100) { nw = 100 - nx; nh = (nw / aspectRatio) * imageAspect; }
          if (ny + nh > 100) { nh = 100 - ny; nw = (nh * aspectRatio) / imageAspect; }
        }

        newCrop = { x: nx, y: ny, width: nw, height: nh, unit: "%" };
      }

      onCropChange(newCrop);
    },
    [isDragging, startCrop, startPos, dragType, aspectRatio, imageWidth, imageHeight, onCropChange]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  if (!crop) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10 select-none"
      style={{ pointerEvents: "none" }}
    >
      {/* Dimmed background */}
      <div className="absolute inset-0 bg-black/50" style={{ 
        clipPath: `polygon(
          0% 0%, 0% 100%, ${crop.x}% 100%, ${crop.x}% ${crop.y}%, 
          ${crop.x + crop.width}% ${crop.y}%, ${crop.x + crop.width}% ${crop.y + crop.height}%, 
          ${crop.x}% ${crop.y + crop.height}%, ${crop.x}% 100%, 100% 100%, 100% 0%
        )` 
      }} />

      {/* Crop Box */}
      <div
        className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)] cursor-move"
        style={{
          left: `${crop.x}%`,
          top: `${crop.y}%`,
          width: `${crop.width}%`,
          height: `${crop.height}%`,
          pointerEvents: "auto",
        }}
        onMouseDown={(e) => handleMouseDown(e, "move")}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
          <div className="border-r border-white/30 border-b border-white/30" />
          <div className="border-r border-white/30 border-b border-white/30" />
          <div className="border-b border-white/30" />
          <div className="border-r border-white/30 border-b border-white/30" />
          <div className="border-r border-white/30 border-b border-white/30" />
          <div className="border-b border-white/30" />
          <div className="border-r border-white/30" />
          <div className="border-r border-white/30" />
          <div />
        </div>

        {/* Handles */}
        <Handle position="top-left" onMouseDown={(e) => handleMouseDown(e, "top-left")} />
        <Handle position="top-right" onMouseDown={(e) => handleMouseDown(e, "top-right")} />
        <Handle position="bottom-left" onMouseDown={(e) => handleMouseDown(e, "bottom-left")} />
        <Handle position="bottom-right" onMouseDown={(e) => handleMouseDown(e, "bottom-right")} />
        
        <Handle position="top" onMouseDown={(e) => handleMouseDown(e, "top")} />
        <Handle position="bottom" onMouseDown={(e) => handleMouseDown(e, "bottom")} />
        <Handle position="left" onMouseDown={(e) => handleMouseDown(e, "left")} />
        <Handle position="right" onMouseDown={(e) => handleMouseDown(e, "right")} />
      </div>
    </div>
  );
}

function Handle({ position, onMouseDown }: { position: string; onMouseDown: (e: React.MouseEvent) => void }) {
  const styles: Record<string, React.CSSProperties> = {
    "top-left": { top: -6, left: -6, cursor: "nwse-resize" },
    "top-right": { top: -6, right: -6, cursor: "nesw-resize" },
    "bottom-left": { bottom: -6, left: -6, cursor: "nesw-resize" },
    "bottom-right": { bottom: -6, right: -6, cursor: "nwse-resize" },
    top: { top: -6, left: "50%", transform: "translateX(-50%)", cursor: "ns-resize" },
    bottom: { bottom: -6, left: "50%", transform: "translateX(-50%)", cursor: "ns-resize" },
    left: { left: -6, top: "50%", transform: "translateY(-50%)", cursor: "ew-resize" },
    right: { right: -6, top: "50%", transform: "translateY(-50%)", cursor: "ew-resize" },
  };

  const isCorner = position.includes("-");

  return (
    <div
      className={`absolute bg-white border border-black/20 ${isCorner ? "w-3 h-3" : "w-4 h-1.5"}`}
      style={{
        ...styles[position],
        ...(position === "left" || position === "right" ? { width: 6, height: 16 } : {}),
        ...(position === "top" || position === "bottom" ? { width: 16, height: 6 } : {}),
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown(e);
      }}
    />
  );
}
