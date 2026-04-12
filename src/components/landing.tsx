"use client";

import React, { useCallback } from "react";
import { Upload, ImagePlus } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";

export default function Landing() {
  const setImage = useEditorStore((s) => s.setImage);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) setImage(result);
      };
      reader.readAsDataURL(file);
    },
    [setImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex-1 flex items-center justify-center">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center gap-6 p-16 border-2 border-dashed border-white/10 rounded-2xl 
                   hover:border-white/25 transition-colors duration-300 cursor-pointer group"
      >
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <ImagePlus className="w-8 h-8 text-white/40 group-hover:text-white/70 transition-colors" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-lg font-medium text-white/80">
            Start your editing here
          </h2>
          <p className="text-sm text-white/40">
            Drag &amp; drop or click to upload a photo
          </p>
          <p className="text-xs text-white/25">Supports JPEG &amp; PNG</p>
        </div>

        <label className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full text-sm font-medium 
                          hover:bg-white/90 transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          Add Photo
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleInputChange}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
