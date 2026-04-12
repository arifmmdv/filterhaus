// =============================================================================
// LUT Application Engine
// Applies a parsed 3D LUT to image pixels using trilinear interpolation.
// Includes caching to avoid re-fetching .cube files.
// =============================================================================

import { LutData } from "@/lib/lutParser";
import { renderLUTToDataURL } from "@/components/LUTCanvas";

// ---------------------------------------------------------------------------
// LUT File Cache (parsed LUT data by path)
// ---------------------------------------------------------------------------
const lutCache = new Map<string, LutData>();

/**
 * Full pipeline: load image → draw on offscreen canvas → fetch & apply LUT → return data URL.
 * This runs entirely off-screen and doesn't block the main canvas.
 */
export async function renderImageWithLut(
  imageSrc: string,
  lutPath: string
): Promise<string> {
  return renderLUTToDataURL(imageSrc, lutPath, 100);
}

/**
 * Generate a small preview thumbnail with a LUT applied.
 * Uses a downscaled canvas for speed.
 */
export async function renderThumbnailWithLut(
  imageSrc: string,
  lutPath: string,
  maxSize: number = 80
): Promise<string> {
  return renderLUTToDataURL(imageSrc, lutPath, 100, maxSize);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}
