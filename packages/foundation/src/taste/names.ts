/**
 * Evocative palette names (Brief #7 Deliverable 1). Every generated
 * palette's 4-6 colors get persisted names shown in Studio/specimens — never
 * bare hexes in the user-facing surface.
 *
 * These names are Arche-curated display labels, not a color standard: the
 * mapping is deterministic (same oklch → same name) and fully documented
 * here. Twelve hue families × four voices (mist/quiet/vivid/deep).
 */

export type NameVoice = "mist" | "quiet" | "vivid" | "deep";

interface HueFamily {
  /** Center hue in degrees. */
  center: number;
  names: Record<NameVoice, string>;
}

const FAMILIES: HueFamily[] = [
  { center: 15, names: { mist: "Petal Mist", quiet: "Clay Grounded", vivid: "Signal Red", deep: "Ember" } },
  { center: 45, names: { mist: "Apricot Wash", quiet: "Copper Line", vivid: "Ember Orange", deep: "Burnt Sienna" } },
  { center: 70, names: { mist: "Honey Milk", quiet: "Brass Note", vivid: "Marigold", deep: "Dark Honey" } },
  { center: 95, names: { mist: "Pear Blossom", quiet: "Moss Whisper", vivid: "Neon Pear", deep: "Forest Floor" } },
  { center: 135, names: { mist: "Mint Veil", quiet: "Sage Counsel", vivid: "Circuit Green", deep: "Pine Depth" } },
  { center: 165, names: { mist: "Sea Glass", quiet: "Eucalyptus", vivid: "Lagoon", deep: "Deep Current" } },
  { center: 195, names: { mist: "Glacier Wash", quiet: "Slate Tide", vivid: "Glacier Pop", deep: "Abyss" } },
  { center: 225, names: { mist: "Porcelain Blue", quiet: "Denim Reserve", vivid: "Azure Signal", deep: "Midnight Ink" } },
  { center: 260, names: { mist: "Lavender Fog", quiet: "Iris Study", vivid: "Ultraviolet", deep: "Nocturne" } },
  { center: 290, names: { mist: "Orchid Haze", quiet: "Plum Ledger", vivid: "Orchid Flash", deep: "Velvet Plum" } },
  { center: 320, names: { mist: "Blossom Veil", quiet: "Mauve Record", vivid: "Magenta Beat", deep: "Wine Cellar" } },
  { center: 350, names: { mist: "Sakura Milk", quiet: "Rose Ledger", vivid: "Sakura Pink", deep: "Bloodwood" } },
];

const OKLCH_RE = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/;

function circularDistance(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return Math.min(d, 360 - d);
}

function voiceOf(l: number, c: number): NameVoice {
  if (l >= 0.88 || (l >= 0.8 && c < 0.05)) return "mist";
  if (l <= 0.4) return "deep";
  if (c >= 0.14) return "vivid";
  return "quiet";
}

/**
 * Name an oklch color string. Non-oklch values (transparent, inherit) fall
 * back to "Unnamed". Pure function — no model, no randomness.
 */
export function nameColor(value: string): string {
  const match = value.match(OKLCH_RE);
  if (!match) return "Unnamed";
  const l = Number(match[1]);
  const c = Number(match[2]);
  const h = Number(match[3]);
  if (c < 0.015) {
    if (l >= 0.95) return "Paper White";
    if (l <= 0.12) return "Ink Black";
    return l >= 0.5 ? "Gallery Gray" : "Slate Gray";
  }
  let family = FAMILIES[0]!;
  let best = Infinity;
  for (const candidate of FAMILIES) {
    const d = circularDistance(h, candidate.center);
    if (d < best) {
      best = d;
      family = candidate;
    }
  }
  return family.names[voiceOf(l, c)];
}

export interface NamedColor {
  name: string;
  role: "background" | "surface" | "primary" | "accent" | "neutral" | "text" | "brand";
  token: string;
  value: string;
}

/** The surfaced roles and the light-mode tokens read for each. Brand reads
 * the brand solid so the plan/picker shows it as "Brand", not "Primary". */
export const NAMED_ROLES = [
  { role: "background", token: "--background" },
  { role: "surface", token: "--card" },
  { role: "primary", token: "--primary" },
  { role: "accent", token: "--accent" },
  { role: "neutral", token: "--muted" },
  { role: "text", token: "--foreground" },
  { role: "brand", token: "--brand" },
] as const;
