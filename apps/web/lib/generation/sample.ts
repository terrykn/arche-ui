import sharp from "sharp";

/**
 * Image door, code half (Brief #6 §6): palette anchors are MEASURED from the
 * uploaded pixels — deterministic code, never the model — so colors are
 * sampled, not hallucinated. The vision model judges axes/enums only.
 */

export interface SampledPalette {
  primaryHue: number;
  accentHue: number;
  neutralHue: number;
}

// sRGB → Oklch (standard matrices; cube-root LMS stage).
function srgbToOklch(r8: number, g8: number, b8: number): { l: number; c: number; h: number } {
  const lin = (v: number): number => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = lin(r8);
  const g = lin(g8);
  const b = lin(b8);
  const lms0 = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const lms1 = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const lms2 = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const c0 = Math.cbrt(lms0);
  const c1 = Math.cbrt(lms1);
  const c2 = Math.cbrt(lms2);
  const l = 0.2104542553 * c0 + 0.793617785 * c1 - 0.0040720468 * c2;
  const a = 1.9779984951 * c0 - 2.428592205 * c1 + 0.4505937099 * c2;
  const bb = 0.0259040371 * c0 + 0.7827717662 * c1 - 0.808675766 * c2;
  const h = (Math.atan2(bb, a) * 180) / Math.PI;
  return { l, c: Math.sqrt(a * a + bb * bb), h: ((h % 360) + 360) % 360 };
}

const BIN_COUNT = 36;

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Samples dominant hues from image bytes. Deterministic: same bytes →
 * same palette. Throws on undecodable input.
 */
export async function samplePalette(bytes: Uint8Array, mimeType: string): Promise<SampledPalette> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(mimeType)) {
    throw new Error(`unsupported image type '${mimeType}' — upload PNG, JPEG, or WebP`);
  }
  const { data, info } = await sharp(bytes, { failOn: "none" })
    .resize(48, 48, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  const bins = new Array<number>(BIN_COUNT).fill(0);
  let neutralX = 0;
  let neutralY = 0;
  let neutralWeight = 0;
  for (let i = 0; i < data.length; i += channels) {
    const alpha = channels === 4 ? data[i + 3]! / 255 : 1;
    if (alpha < 0.5) continue;
    const { l, c, h } = srgbToOklch(data[i]!, data[i + 1]!, data[i + 2]!);
    if (l < 0.12 || l > 0.96) continue;
    if (c < 0.02) {
      // Near-gray: votes for the neutral anchor by vector average (no wrap bug).
      const rad = (h * Math.PI) / 180;
      neutralX += Math.cos(rad);
      neutralY += Math.sin(rad);
      neutralWeight += 1;
      continue;
    }
    bins[Math.floor(h / (360 / BIN_COUNT)) % BIN_COUNT]! += c * alpha;
  }
  const ranked = bins
    .map((weight, bin) => ({ weight, hue: bin * (360 / BIN_COUNT) + 360 / BIN_COUNT / 2 }))
    .sort((a, b) => b.weight - a.weight);
  const top = ranked[0];
  if (!top || top.weight <= 0) {
    // Grayscale image: every anchor reads the neutral average.
    const fallback =
      neutralWeight > 0 ? ((Math.atan2(neutralY, neutralX) * 180) / Math.PI + 360) % 360 : 0;
    const rounded = Math.round(fallback) % 360;
    return { primaryHue: rounded, accentHue: rounded, neutralHue: rounded };
  }
  const primaryHue = top.hue;
  const accent = ranked.find((b) => hueDistance(b.hue, primaryHue) >= 60);
  const neutralHue =
    neutralWeight > 0
      ? Math.round(((Math.atan2(neutralY, neutralX) * 180) / Math.PI + 360) % 360) % 360
      : Math.round(primaryHue) % 360;
  return {
    primaryHue: Math.round(primaryHue) % 360,
    accentHue: Math.round((accent ?? top).hue) % 360,
    neutralHue,
  };
}
