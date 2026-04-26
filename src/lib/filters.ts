import { Adjustments } from "@/types";

export function getAdjustmentsFilter(adjustments: Adjustments): string {
  const {
    exposure,
    contrast,
    saturation,
    temperature,
    tint,
    fade,
  } = adjustments;

  const filters: string[] = [];

  // Exposure -> brightness (0.5 to 1.5)
  if (exposure !== 0) {
    const val = 1 + exposure / 100;
    filters.push(`brightness(${val})`);
  }

  // Contrast -> contrast (0.5 to 1.5)
  if (contrast !== 0) {
    const val = 1 + contrast / 100;
    filters.push(`contrast(${val})`);
  }

  // Saturation -> saturate (0 to 2)
  if (saturation !== 0) {
    const val = 1 + saturation / 100;
    filters.push(`saturate(${val})`);
  }

  // Temperature -> simplified via sepia/hue-rotate
  if (temperature !== 0) {
    if (temperature > 0) {
      // Warm: use sepia
      filters.push(`sepia(${temperature / 200})`);
    } else {
      // Cool: use hue-rotate (approximate)
      filters.push(`hue-rotate(${temperature / 2}deg)`);
    }
  }

  // Tint -> hue-rotate
  if (tint !== 0) {
    filters.push(`hue-rotate(${tint / 2}deg)`);
  }

  // Fade -> simplified as decrease in contrast and increase in brightness
  if (fade > 0) {
    const contrastVal = 1 - (fade / 200);
    const brightnessVal = 1 + (fade / 500);
    filters.push(`contrast(${contrastVal}) brightness(${brightnessVal})`);
  }

  return filters.join(" ");
}

export function getCombinedFilter(
  baseFilter: string | null,
  adjustments: Adjustments
): string {
  const adjFilter = getAdjustmentsFilter(adjustments);
  if (!baseFilter || baseFilter === "none") {
    return adjFilter || "none";
  }
  return `${baseFilter} ${adjFilter}`.trim();
}
