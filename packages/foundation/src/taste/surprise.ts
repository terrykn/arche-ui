import type { DnaPalette, GenerationProfile } from "../dna/dna.js";

/**
 * Accent surprise (Brief #7 Deliverable 1, teach-tier). Blue-on-blue is
 * "predictable" and scores low; the compiler reports the score and the
 * band. Teach-tier means reported, never a failure — the enterprise
 * profile is monochrome-by-design and always scores 0 without a note.
 */

export type SurpriseBand = "predictable" | "related" | "surprising" | "monochrome-by-design";

export interface SurpriseScore {
  /** 0-100: circular accent-vs-primary hue distance mapped onto 0-180°. */
  score: number;
  band: SurpriseBand;
  /** Hue distance in degrees, for the log. */
  hueDistance: number;
}

export function circularHueDistance(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return Math.round(Math.min(d, 360 - d) * 1000) / 1000;
}

export function scoreSurprise(palette: DnaPalette, profile: GenerationProfile): SurpriseScore {
  if (profile === "enterprise") {
    return { score: 0, band: "monochrome-by-design", hueDistance: 0 };
  }
  const hueDistance = circularHueDistance(palette.accentHue, palette.primaryHue);
  const score = Math.round((hueDistance / 180) * 100);
  const band: SurpriseBand = hueDistance < 25 ? "predictable" : hueDistance < 90 ? "related" : "surprising";
  return { score, band, hueDistance };
}

/**
 * Accent placement (teach-tier). The accent lands on the primary CTA and
 * the focal word only — never on backgrounds or body text. Recorded on the
 * payload as intent; page-level placement is checked at page generation
 * (Deliverable 3), where block slots make it checkable.
 */
export const ACCENT_PLACEMENT: ReadonlyArray<string> = ["primary-cta", "focal-word"];
