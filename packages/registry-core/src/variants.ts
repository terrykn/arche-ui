/**
 * Picker variants proposed by the model in the single generation call.
 *
 * One prompt returns one DNA plus exactly 3 palette variants (step 1) and
 * exactly 3 typography variants (separate step, never paired with a
 * palette). The picker narrows from there: the chosen palette anchors and
 * the chosen header/body pair fold into the final compile; everything the
 * user does not pick stays as the model dreamed it.
 *
 * Semantic validation lives here (code decides): schema shape is enforced
 * by the zod response schema with a retry, but an unknown font id or an
 * incompatible pairing never burns a model call — the offending variant is
 * replaced by a deterministic fallback in the same position, so output
 * positions stay stable. Fallbacks for palettes reuse derivePaletteOptions;
 * fallbacks for typefaces reuse the compiler's own pick plus registered
 * compatible pairs.
 */
import {
  expectedFontStack,
  fontCssUrl,
  fontEntriesById,
  recommendedFontPairs,
  validateFontPairing,
  type FontEntry,
} from "@arche-ui/foundation/fonts";
import type {
  DnaPalette,
  GenerationProfile,
  PaletteVariant,
  TypefaceVariant,
} from "@arche-ui/foundation/dna";
import { derivePaletteOptions } from "./picker.js";

export type { PaletteVariant, TypefaceVariant };

function normHue(degrees: unknown): number | null {
  if (typeof degrees !== "number" || !Number.isFinite(degrees)) return null;
  if (degrees < 0 || degrees > 360) return null;
  return Math.round(degrees * 10) / 10;
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) return null;
  return trimmed;
}

function cleanAnchors(value: unknown): DnaPalette | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const primaryHue = normHue(v.primaryHue);
  const accentHue = normHue(v.accentHue);
  const neutralHue = normHue(v.neutralHue);
  if (primaryHue === null || accentHue === null || neutralHue === null) return null;
  // Brand Token brief: the brand anchor round-trips with the variant;
  // a missing or malformed brandHue defaults to the primary hue (never
  // invalid — only the three core anchors can fail a variant).
  const brandHue = normHue(v.brandHue) ?? primaryHue;
  return { primaryHue, accentHue, neutralHue, brandHue };
}

function cleanPaletteVariant(value: unknown): PaletteVariant | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const id = cleanText(v.id, 40);
  const name = cleanText(v.name, 60);
  const reason = cleanText(v.reason, 200);
  const anchors = cleanAnchors(v.anchors);
  if (!id || !name || !reason || !anchors) return null;
  return { id, name, anchors, reason };
}

/**
 * Normalize the model's 3 palette variants. Valid entries pass through
 * untouched; any missing/invalid/duplicate entry is replaced by the
 * deterministic derivation in the same position (code decides, the model
 * suggests). Always returns exactly 3 variants with unique ids.
 */
export function normalizePaletteVariants(
  raw: unknown,
  base: DnaPalette,
  profile: GenerationProfile = "standard",
): [PaletteVariant, PaletteVariant, PaletteVariant] {
  const fallback = derivePaletteOptions(base, profile).map((option) => ({
    id: option.id,
    name: option.name,
    anchors: { ...option.anchors },
    reason: option.reason,
  }));
  const list = Array.isArray(raw) ? raw : [];
  const seen = new Set<string>();
  const out: PaletteVariant[] = [];
  for (let i = 0; i < 3; i++) {
    const cleaned = cleanPaletteVariant(list[i]);
    if (cleaned && !seen.has(cleaned.id)) {
      seen.add(cleaned.id);
      out.push(cleaned);
    } else {
      let replacement = fallback[i]!;
      if (seen.has(replacement.id)) {
        replacement = { ...replacement, id: `palette-${i + 1}` };
      }
      seen.add(replacement.id);
      out.push(replacement);
    }
  }
  return out as [PaletteVariant, PaletteVariant, PaletteVariant];
}

function slotAllows(entry: FontEntry, slot: "display" | "body"): boolean {
  return entry.slots.includes(slot);
}

function cleanTypefaceVariant(
  value: unknown,
  byId: Map<string, FontEntry>,
): TypefaceVariant | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const id = cleanText(v.id, 40);
  const name = cleanText(v.name, 60);
  const reason = cleanText(v.reason, 200);
  if (!id || !name || !reason) return null;
  if (typeof v.display !== "string" || typeof v.body !== "string") return null;
  const displayEntry = byId.get(v.display);
  const bodyEntry = byId.get(v.body);
  if (!displayEntry || !bodyEntry) return null;
  if (!slotAllows(displayEntry, "display")) return null;
  if (!slotAllows(bodyEntry, "body")) return null;
  if (validateFontPairing(displayEntry, bodyEntry).length > 0) return null;
  return { id, name, display: displayEntry.id, body: bodyEntry.id, reason };
}

/**
 * Normalize the model's 3 typography variants against the closed font
 * registry (unknown ids, wrong slots, and incompatible pairings are
 * replaced deterministically). Slots 1–3 are the model's variants; slots
 * 4–6 are registered compatible pairings not already chosen, so the step
 * always offers six distinct choices. The first fallback is always the
 * compiler's own pick for the DNA ("As Dreamed"). Always returns exactly
 * 6 variants with unique ids.
 */
export function normalizeTypefaceVariants(
  raw: unknown,
  compilerPick: { display: string; sans: string },
): TypefaceVariant[] {
  const byId = fontEntriesById();
  const fallback: TypefaceVariant[] = [
    {
      id: "as-dreamed",
      name: "As Generated",
      display: compilerPick.display,
      body: compilerPick.sans,
      reason: "The generation's own header/body pairing, untouched.",
    },
  ];
  for (const [display, body] of recommendedFontPairs()) {
    if (fallback.length >= 6) break;
    if (display === compilerPick.display && body === compilerPick.sans) continue;
    const displayEntry = byId.get(display);
    const bodyEntry = byId.get(body);
    if (!displayEntry || !bodyEntry) continue;
    fallback.push({
      id: `${display}-over-${body}`,
      name: `${displayEntry.family} over ${bodyEntry.family}`,
      display,
      body,
      reason: "A registered compatible pairing from the font registry.",
    });
  }
  const pairingTaken = (display: string, body: string): boolean =>
    out.some((option) => option.display === display && option.body === body);
  const uniqueId = (id: string): string => {
    if (!seen.has(id)) return id;
    let n = 2;
    while (seen.has(`${id}-${n}`)) n++;
    return `${id}-${n}`;
  };
  const list = Array.isArray(raw) ? raw : [];
  const seen = new Set<string>();
  const out: TypefaceVariant[] = [];
  for (let i = 0; i < 3; i++) {
    const cleaned = cleanTypefaceVariant(list[i], byId);
    if (cleaned && !seen.has(cleaned.id) && !pairingTaken(cleaned.display, cleaned.body)) {
      seen.add(cleaned.id);
      out.push(cleaned);
      continue;
    }
    // Replacement: first fallback at/after this position whose id and
    // pairing are both still free — a bad model slot must never clone an
    // earlier choice.
    let placed = false;
    for (let j = i; j < fallback.length; j++) {
      const candidate = fallback[j]!;
      if (seen.has(candidate.id) || pairingTaken(candidate.display, candidate.body)) continue;
      const id = uniqueId(candidate.id);
      seen.add(id);
      out.push({ ...candidate, id });
      placed = true;
      break;
    }
    if (!placed) {
      const candidate = fallback[Math.min(i, fallback.length - 1)]!;
      const id = uniqueId(`${candidate.id}-alt`);
      seen.add(id);
      out.push({ ...candidate, id });
    }
  }
  for (const candidate of fallback) {
    if (out.length >= 6) break;
    if (pairingTaken(candidate.display, candidate.body)) continue;
    const id = uniqueId(candidate.id);
    seen.add(id);
    out.push({ ...candidate, id });
  }
  // Defensive: the registry always holds enough pairs that this never
  // triggers; it keeps the six-slot contract if it ever does.
  let pad = 0;
  while (out.length < 6) {
    const candidate = fallback[pad % fallback.length]!;
    pad++;
    const id = uniqueId(`${candidate.id}-alt`);
    seen.add(id);
    out.push({ ...candidate, id });
  }
  return out;
}

export interface TypefaceSpec {
  id: string;
  family: string;
  /** CSS font-family value for specimens and --font-* tokens. */
  stack: string;
  /** Stylesheet URL for live specimens (Fontshare only; null for Google). */
  cssUrl: string | null;
}

export interface TypefaceOptionSpec {
  display: TypefaceSpec;
  body: TypefaceSpec;
}

/**
 * Resolve a typography variant to renderable specimens: family names,
 * exact token stacks, and stylesheet URLs. Pure + deterministic.
 */
export function typefaceSpec(displayId: string, bodyId: string): TypefaceOptionSpec | null {
  const byId = fontEntriesById();
  const displayEntry = byId.get(displayId);
  const bodyEntry = byId.get(bodyId);
  if (!displayEntry || !bodyEntry) return null;
  const spec = (entry: FontEntry, role: "display" | "sans"): TypefaceSpec => ({
    id: entry.id,
    family: entry.family,
    stack: expectedFontStack(entry, role),
    cssUrl: fontCssUrl(entry),
  });
  return { display: spec(displayEntry, "display"), body: spec(bodyEntry, "sans") };
}

/**
 * Compact closed-registry allowlist for the model prompt: every header and
 * body pick must be one of these ids, and pairs should come from the
 * recommended list. Cached per process (registry JSON is static).
 */
let cachedFontChoiceBlock: string | null = null;

export function fontChoiceBlock(): string {
  if (cachedFontChoiceBlock) return cachedFontChoiceBlock;
  const byId = fontEntriesById();
  const display = [...byId.values()]
    .filter((f) => f.slots.includes("display"))
    .map((f) => `${f.id} (${f.family})`);
  const body = [...byId.values()]
    .filter((f) => f.slots.includes("body"))
    .map((f) => `${f.id} (${f.family})`);
  const pairs = recommendedFontPairs().map(([d, b]) => `${d}+${b}`);
  cachedFontChoiceBlock = [
    `Header (display-slot) ids: ${display.join(", ")}.`,
    `Body (body-slot) ids: ${body.join(", ")}.`,
    `Prefer a recommended display+body pair: ${pairs.join(", ")}.`,
  ].join(" ");
  return cachedFontChoiceBlock;
}

/**
 * Validate a caller-supplied header/body override (picker selection
 * round-tripped through the client). Throws naming the violation — the
 * service validates before compiling so a tampered id can never reach a
 * payload.
 */
export function assertTypefaceOverride(pick: { display: string; sans: string }): void {
  const byId = fontEntriesById();
  const displayEntry = byId.get(pick.display);
  const bodyEntry = byId.get(pick.sans);
  if (!displayEntry) {
    throw new Error(`compiler typeface override: display font '${pick.display}' is not in the closed font registry`);
  }
  if (!bodyEntry) {
    throw new Error(`compiler typeface override: body font '${pick.sans}' is not in the closed font registry`);
  }
  if (!slotAllows(displayEntry, "display")) {
    throw new Error(
      `compiler typeface override: font '${displayEntry.id}' (${displayEntry.family}) may not fill the display slot`,
    );
  }
  if (!slotAllows(bodyEntry, "body")) {
    throw new Error(
      `compiler typeface override: font '${bodyEntry.id}' (${bodyEntry.family}) is display-only and must not be selected for body text`,
    );
  }
  const issues = validateFontPairing(displayEntry, bodyEntry);
  if (issues.length > 0) {
    throw new Error(`compiler typeface override: ${issues[0]!.message}`);
  }
}
