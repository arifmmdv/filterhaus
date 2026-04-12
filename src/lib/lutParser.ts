/**
 * Parses a .cube LUT file and returns the 3D LUT data as a Float32Array
 * along with the LUT size.
 */
export interface LutData {
  size: number;
  table: Float32Array; // RGBA values, length = size^3 * 4
}

export async function parseCubeFile(url: string): Promise<LutData> {
  const response = await fetch(url);
  const text = await response.text();
  const lines = text.split('\n');

  let size = 0;
  const colors: number[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('TITLE')) continue;

    if (trimmed.startsWith('LUT_3D_SIZE')) {
      size = parseInt(trimmed.split(/\s+/)[1], 10);
      continue;
    }

    // Skip other metadata
    if (trimmed.startsWith('DOMAIN_MIN') || trimmed.startsWith('DOMAIN_MAX')) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 3) {
      const r = parseFloat(parts[0]);
      const g = parseFloat(parts[1]);
      const b = parseFloat(parts[2]);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        colors.push(r, g, b, 1.0);
      }
    }
  }

  if (size === 0) throw new Error('Invalid .cube file: missing LUT_3D_SIZE');

  const expected = size * size * size;
  if (colors.length / 4 !== expected) {
    console.warn(`LUT expected ${expected} entries, got ${colors.length / 4}`);
  }

  return { size, table: new Float32Array(colors) };
}
