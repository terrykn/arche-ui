/**
 * Deterministic block-variant selector (Brief #7, Deliverable 3).
 *
 * A variant is a named axis-value combination on a block manifest (e.g. hero
 * alignment=left + mediaLayout=below). The same block yields different
 * variants per context by design — selection is keyed to genre + content
 * signals + identity (DNA ranges + art direction), never to block names shown
 * in the UI. "Try a different hero" walks the ranked list behind the scenes.
 *
 * Pure functions, no I/O: manifests are passed in (never imported — this
 * module ships to the browser via the editor). Deterministic: same manifests
 * + context → byte-identical selections, no model calls.
 */
import type { GenreId } from "./genres.js";

export type MediaSignal = "none" | "image" | "video" | "product";

export interface ContentSignals {
  category: string;
  audience: string;
  media: MediaSignal;
  tone: string[];
}

export interface SelectorDna {
  formality?: number;
  energy?: number;
  playfulness?: number;
  density?: number;
  chroma?: number;
  warmth?: number;
  /**
   * Composition affinity layer (Part 1): the DNA's primary composition.
   * When present, variants tagged with that composition score +1
   * (decisive only between placement-equal variants — media and
   * formal/enterprise signals keep their existing weight).
   */
  composition?: string;
  /** DNA-level imagery direction (informational for surface choice). */
  imagery?: string;
}

export interface SelectorContext {
  genre: GenreId;
  content: Partial<ContentSignals>;
  dna?: SelectorDna;
  /** Art-direction registry id (e.g. "swiss-poster"), when known. */
  artDirection?: string;
  /**
   * Brand Token brief: prefer the hero's brand CTA when the brand and
   * primary hues differ by more than 30° (the caller derives this from
   * the DNA palette; the compiler records the same choice on the draft
   * as meta.brand.heroCta).
   */
  brandCta?: boolean;
}

export interface ResolvedContent extends ContentSignals {
  tone: string[];
}

export interface BlockVariantSelection {
  block: string;
  axes: Record<string, string>;
  reason: string;
}

export interface RankedVariant {
  axes: Record<string, string>;
  reason: string;
}

/** Minimal manifest shape the selector reads (subset of Manifest). */
export interface AxisSource {
  name: string;
  axes: Record<string, { values: Array<string | number>; default: string | number }>;
}

/** Neutral context for catalog surfaces (no generation intent known). */
export const NEUTRAL_CONTEXT: SelectorContext = {
  genre: "landing",
  content: { category: "general", audience: "general", media: "none", tone: [] },
};

function resolveContent(content: Partial<ContentSignals>): ResolvedContent {
  return {
    category: content.category ?? "general",
    audience: content.audience ?? "general",
    media: content.media ?? "none",
    tone: content.tone ?? [],
  };
}

function hasTone(content: ResolvedContent, ...words: string[]): boolean {
  const tones = new Set(content.tone.map((t) => t.toLowerCase()));
  return words.some((w) => tones.has(w.toLowerCase()));
}

function isFormal(dna: SelectorDna | undefined, direction: string | undefined): boolean {
  return (
    (dna?.formality ?? 0.5) > 0.7 ||
    direction === "boardroom-red" ||
    direction === "swiss-poster"
  );
}

/** Cartesian product of axis values, in manifest key order (canonical). */
function canonicalCombos(source: AxisSource): Record<string, string>[] {
  const keys = Object.keys(source.axes);
  if (keys.length === 0) return [{}];
  return keys.reduce<Record<string, string>[]>(
    (combos, key) =>
      combos.flatMap((combo) =>
        source.axes[key]!.values.map((value) => ({ ...combo, [key]: String(value) })),
      ),
    [{}],
  );
}

function axesEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] ?? "") !== (b[key] ?? "")) return false;
  }
  return true;
}

interface Scored {
  axes: Record<string, string>;
  score: number;
  reason: string;
}

/**
 * Hero variant affinity (Brief #8, Deliverable 3) — the DNA ranges each
 * hero variant is built for, declared in hero.block.json `variantAffinity`
 * and mirrored here as the scoring table. Missing range = no opinion.
 */
interface VariantAffinity {
  formality?: readonly [number, number];
  energy?: readonly [number, number];
  chroma?: readonly [number, number];
  playfulness?: readonly [number, number];
  warmth?: readonly [number, number];
  notes: string;
}

const HERO_AFFINITY: Record<string, VariantAffinity> = {
  "left/below": {
    formality: [0.6, 1], energy: [0, 0.25], chroma: [0, 0.4], playfulness: [0.2, 0.6],
    notes: "quiet editorial hero",
  },
  "left/right": {
    formality: [0.7, 1], chroma: [0, 0.4], playfulness: [0, 0.3],
    notes: "trust hero",
  },
  "center/below": {
    warmth: [0.6, 1], chroma: [0.3, 0.7], energy: [0.3, 0.7],
    notes: "warm photographic hero",
  },
  "center/none": {
    energy: [0, 0.5], formality: [0, 0.6],
    notes: "centered statement hero",
  },
  "left/none": {
    formality: [0.7, 1], energy: [0, 0.4],
    notes: "swiss-poster discipline hero",
  },
  "center/right": {
    energy: [0.4, 1],
    notes: "product split hero",
  },
};

/** Distance between DNA and one variant's affinity ranges (0 = built for it). */
function affinityDistance(
  key: string,
  dna: SelectorDna | undefined,
): { distance: number; decidingAxis: string } {
  const affinity = HERO_AFFINITY[key];
  if (!affinity) return { distance: 0, decidingAxis: "media" };
  let distance = 0;
  let decidingAxis = "media";
  let worst = 0;
  for (const axis of ["formality", "energy", "chroma", "playfulness", "warmth"] as const) {
    const range = affinity[axis];
    if (!range) continue;
    const value = dna?.[axis] ?? 0.5;
    const miss = value < range[0] ? range[0] - value : value > range[1] ? value - range[1] : 0;
    distance += miss;
    if (miss > worst) {
      worst = miss;
      decidingAxis = axis;
    }
  }
  return { distance: Math.round(distance * 1000) / 1000, decidingAxis };
}

function scoreHero(axes: Record<string, string>, genre: GenreId, content: ResolvedContent, dna: SelectorDna | undefined, direction: string | undefined, brandCta = false): { score: number; reason: string } {
  let score = 0;
  const why: string[] = [];
  const formal = isFormal(dna, direction);
  const enterprise = content.audience === "executive" || content.category === "enterprise" || content.category === "construction" || hasTone(content, "enterprise", "formal");
  const key = `${axes.alignment ?? "center"}/${axes.mediaLayout ?? "none"}`;
  const { distance, decidingAxis } = affinityDistance(key, dna);
  // Affinity is the DNA tiebreak under the genre/media placement logic:
  // weight 2 keeps media + formal/enterprise signals decisive when no DNA
  // is present, while DNA distance decides between placement-equal variants.
  score -= distance * 2;
  const affinityNotes = HERO_AFFINITY[key]?.notes ?? "fallback combination";
  if (content.media === "none") {
    if (axes.mediaLayout === "none") { score += 2; why.push("no media — centered statement"); }
  } else if (content.media === "product") {
    if (axes.mediaLayout === "right") { score += 2; why.push("product media splits beside the headline"); }
    else if (axes.mediaLayout === "below") { score += 1; }
  } else {
    if (axes.mediaLayout === "below") { score += 2; why.push("brand imagery sits below the headline"); }
    else if (axes.mediaLayout === "right") { score += 1; }
  }
  if (formal || enterprise || content.audience === "technical") {
    if (axes.alignment === "left") { score += 2; why.push("left-aligned for a formal/technical voice"); }
  } else if (axes.alignment === "center") {
    score += 2; why.push("centered default voice");
  }
  if (direction === "swiss-poster" && axes.alignment === "left" && axes.mediaLayout === "none") {
    score += 1; why.push("swiss-poster grid discipline");
  }
  // Brand Token brief (Brief #8 §6 hero brandCta affinity): a distinct
  // brand hue (>30° from primary) spends the hero's primary CTA on the
  // brand variant; otherwise the primary variant holds. Manifest order
  // keeps "primary" first, so ties resolve to primary without a boost.
  if (brandCta && (axes.ctaVariant ?? "primary") === "brand") {
    score += 2; why.push("brand CTA for a distinct brand hue (>30° from primary)");
  }
  if (why.length === 0) why.push(affinityNotes);
  else why.unshift(affinityNotes);
  return { score, reason: `hero → ${axes.alignment} / ${axes.mediaLayout}: ${why.join("; ")} (genre ${genre}, variant ${key}, dnaDistance ${distance}, decidingAxis ${decidingAxis})` };
}

function scoreFeatures(axes: Record<string, string>, genre: GenreId, content: ResolvedContent, dna: SelectorDna | undefined, direction: string | undefined): { score: number; reason: string } {
  const expressive =
    (dna?.energy ?? 0.5) > 0.65 ||
    (dna?.playfulness ?? 0.5) > 0.65 ||
    content.media !== "none" ||
    (direction !== undefined && ["glassmorphism", "typographic-maximalism", "2000s-futurism", "crt-hardware", "tactilism"].includes(direction));
  const comparative = content.audience === "technical" || hasTone(content, "compare", "comparison", "technical", "detailed");
  let score = 0;
  let why = "quiet grid default";
  if (expressive && axes.layout === "bento") { score += 2; why = "bento for an expressive, media-rich story"; }
  else if (!expressive && comparative && axes.layout === "split") { score += 2; why = "split for a technical comparison"; }
  else if (!expressive && !comparative && axes.layout === "grid") { score += 2; }
  else if (axes.layout === "grid") { score += 1; }
  return { score, reason: `features → ${axes.layout}: ${why} (genre ${genre})` };
}

function scorePricing(axes: Record<string, string>, genre: GenreId, content: ResolvedContent): { score: number; reason: string } {
  const enterprise = content.audience === "executive" || hasTone(content, "enterprise", "premium");
  const simple = hasTone(content, "simple", "minimal", "solo", "starter");
  let score = 0;
  let why = "three-tier default";
  if (enterprise && axes.tierCount === "four") { score += 2; why = "four tiers for an enterprise line"; }
  else if (!enterprise && simple && axes.tierCount === "two") { score += 2; why = "two tiers for a simple offer"; }
  else if (!enterprise && !simple && axes.tierCount === "three") { score += 2; }
  else if (axes.tierCount === "three") { score += 1; }
  return { score, reason: `pricing → ${axes.tierCount}: ${why} (genre ${genre})` };
}

function scoreTestimonials(axes: Record<string, string>, genre: GenreId, content: ResolvedContent, dna: SelectorDna | undefined, direction: string | undefined): { score: number; reason: string } {
  const premium = isFormal(dna, direction) || hasTone(content, "premium", "exclusive", "luxury");
  let score = 0;
  let why = "grid of short proof quotes";
  if (premium && axes.layout === "single") { score += 2; why = "single featured quote for a premium voice"; }
  else if (!premium && axes.layout === "grid") { score += 2; }
  else if (axes.layout === "grid") { score += 1; }
  return { score, reason: `testimonials → ${axes.layout}: ${why} (genre ${genre})` };
}

function scoreCta(axes: Record<string, string>, heroAlignment: string, genre: GenreId): { score: number; reason: string } {
  const score = axes.alignment === heroAlignment ? 2 : 0;
  return { score, reason: `cta → ${axes.alignment}: mirrors the hero alignment (placement coherence, genre ${genre})` };
}

function scoreStatsRow(axes: Record<string, string>, content: ResolvedContent, genre: GenreId): { score: number; reason: string } {
  const focused = content.audience === "executive" || hasTone(content, "minimal", "focused");
  let score = 0;
  let why = "four-column overview default";
  if (focused && axes.columns === "three") { score += 2; why = "three columns when the page answers one question"; }
  else if (!focused && axes.columns === "four") { score += 2; }
  else if (axes.columns === "four") { score += 1; }
  return { score, reason: `stats-row → ${axes.columns}: ${why} (genre ${genre})` };
}

function scoreLogoCloud(axes: Record<string, string>, genre: GenreId, content: ResolvedContent, dna: SelectorDna | undefined): { score: number; reason: string } {
  const dense = (dna?.density ?? 0.5) > 0.65 || hasTone(content, "compact", "dense", "many");
  let score = 0;
  let why = "flowing row default";
  if (dense && axes.layout === "grid") { score += 2; why = "grid wall for a dense logo set"; }
  else if (!dense && axes.layout === "row") { score += 2; }
  else if (axes.layout === "row") { score += 1; }
  return { score, reason: `logo-cloud → ${axes.layout}: ${why} (genre ${genre})` };
}

function scoreStatsBand(axes: Record<string, string>, content: ResolvedContent, genre: GenreId): { score: number; reason: string } {
  const focused = content.audience === "executive" || hasTone(content, "minimal", "focused");
  let score = 0;
  let why = "four-number band default";
  if (focused && axes.columns === "two") { score += 2; why = "two numbers when the band answers one question"; }
  else if (!focused && axes.columns === "four") { score += 2; }
  else if (axes.columns === "four") { score += 1; }
  return { score, reason: `stats-band → ${axes.columns}: ${why} (genre ${genre})` };
}

function scoreFaq(axes: Record<string, string>, content: ResolvedContent, genre: GenreId): { score: number; reason: string } {
  const technical = content.audience === "technical" || hasTone(content, "detailed", "technical", "compare", "comparison");
  let score = 0;
  let why = "single-column reading default";
  if (technical && axes.layout === "split") { score += 2; why = "split for a long technical list beside its headline"; }
  else if (!technical && axes.layout === "single") { score += 2; }
  else if (axes.layout === "single") { score += 1; }
  return { score, reason: `faq → ${axes.layout}: ${why} (genre ${genre})` };
}

function scoreNewsletter(axes: Record<string, string>, heroAlignment: string, genre: GenreId): { score: number; reason: string } {
  const score = (heroAlignment === "left") === (axes.layout === "split") ? 2 : 0;
  return { score, reason: `newsletter-signup → ${axes.layout}: follows the hero alignment (placement coherence, genre ${genre})` };
}

function scoreFooter(axes: Record<string, string>, content: ResolvedContent, genre: GenreId, dna: SelectorDna | undefined, direction: string | undefined): { score: number; reason: string } {
  const minimal = hasTone(content, "minimal", "simple") || genre === "auth";
  const formal = isFormal(dna, direction);
  let score = 0;
  let why = "extended sitemap default";
  if (minimal && axes.layout === "compact") { score += 2; why = "compact for a minimal close"; }
  else if (!minimal && formal && axes.layout === "extended") { score += 2; why = "extended sitemap for a formal voice"; }
  else if (!minimal && axes.layout === "extended") { score += 2; }
  else if (axes.layout === "extended") { score += 1; }
  return { score, reason: `site-footer → ${axes.layout}: ${why} (genre ${genre})` };
}

function scoreAuth(axes: Record<string, string>, blockName: string, content: ResolvedContent, dna: SelectorDna | undefined, direction: string | undefined): { score: number; reason: string } {
  const expressive =
    (dna?.energy ?? 0.5) > 0.65 ||
    (dna?.playfulness ?? 0.5) > 0.65 ||
    hasTone(content, "branded", "expressive", "bold") ||
    (direction !== undefined && ["glassmorphism", "typographic-maximalism", "2000s-futurism", "crt-hardware", "tactilism"].includes(direction));
  let score = 0;
  let why = "centered card default";
  if (expressive && axes.layout === "split") { score += 2; why = "brand panel beside the card for an expressive voice"; }
  else if (!expressive && axes.layout === "centered") { score += 2; }
  else if (axes.layout === "centered") { score += 1; }
  return { score, reason: `${blockName} → ${axes.layout}: ${why}` };
}

/**
 * Composition affinity tags (Part 1): ONE primary composition per variant.
 * Tag what the variant *is*, not what it could become — removing the
 * imagery leaves the primary. Mirrors the `variantComposition` key that
 * block manifests carry for Terry's tagging pass.
 */
export const VARIANT_COMPOSITIONS: Record<string, Record<string, string>> = {
  hero: {
    "left/below": "editorial",
    "left/right": "split",
    "center/below": "stacked",
    "center/none": "centered",
    "left/none": "grid-strict",
    "center/right": "split",
  },
  features: { bento: "bento", grid: "card-grid", split: "split" },
  pricing: { two: "card-grid", three: "card-grid", four: "card-grid" },
  testimonials: { grid: "card-grid", single: "centered" },
  cta: { center: "centered", left: "split" },
  "stats-row": { three: "grid-strict", four: "grid-strict" },
  "logo-cloud": { row: "centered", grid: "card-grid" },
  "stats-band": { two: "grid-strict", four: "grid-strict" },
  faq: { single: "stacked", split: "split" },
  "newsletter-signup": { centered: "centered", split: "split" },
  "site-footer": { compact: "minimal-text", extended: "stacked" },
  "auth-login": { centered: "centered", split: "split" },
  "auth-signup": { centered: "centered", split: "split" },
  "app-shell": { fixed: "sidebar-led", collapsible: "sidebar-led" },
};

/** Primary composition tag for a variant combo (null = no opinion). */
export function compositionOfVariant(blockName: string, axes: Record<string, string>): string | null {
  const table = VARIANT_COMPOSITIONS[blockName];
  if (!table) return null;
  const key = variantKey(blockName, axes);
  return table[key] ?? null;
}

function variantKey(blockName: string, axes: Record<string, string>): string {
  switch (blockName) {
    case "hero":
      return `${axes.alignment ?? "center"}/${axes.mediaLayout ?? "none"}`;
    case "features":
    case "logo-cloud":
    case "faq":
    case "newsletter-signup":
    case "site-footer":
    case "auth-login":
    case "auth-signup":
      return axes.layout ?? "";
    case "pricing":
      return axes.tierCount ?? "";
    case "testimonials":
      return axes.layout ?? "";
    case "cta":
      return axes.alignment ?? "";
    case "stats-row":
    case "stats-band":
      return axes.columns ?? "";
    case "app-shell":
      return axes.sidebar ?? "";
    default:
      return Object.values(axes).join("/");
  }
}

function scoreAppShell(axes: Record<string, string>, genre: GenreId, dna: SelectorDna | undefined): { score: number; reason: string } {
  const dense = (dna?.density ?? 0.5) > 0.7 || genre === "dashboard";
  let score = 0;
  let why = "fixed sidebar default";
  if (dense && axes.sidebar === "collapsible") { score += 2; why = "collapsible sidebar for a dense operational tool"; }
  else if (!dense && axes.sidebar === "fixed") { score += 2; }
  else if (axes.sidebar === "fixed") { score += 1; }
  return { score, reason: `app-shell → ${axes.sidebar}: ${why} (genre ${genre})` };
}

/**
 * Ranked variants for one block: selected combination first, the rest in
 * canonical order by score (ties keep manifest order). Never empty.
 */
export function rankedVariants(
  blockName: string,
  source: AxisSource,
  context: SelectorContext = NEUTRAL_CONTEXT,
): RankedVariant[] {
  const content = resolveContent(context.content);
  const dna = context.dna;
  const direction = context.artDirection;
  const combos = canonicalCombos(source);
  if (combos.length === 1) {
    return [{ axes: combos[0]!, reason: `${blockName}: single layout (no variant axes) — identity skins it.` }];
  }
  // cta + newsletter-signup mirror whatever hero selects: rank hero first.
  const heroFirst =
    blockName === "cta" || blockName === "newsletter-signup"
      ? (rankedVariants("hero", { name: "hero", axes: HERO_AXES_FALLBACK }, context)[0]!.axes.alignment ?? "center")
      : null;
  const scored: Scored[] = combos.map((axes) => {
    let scoredBy: { score: number; reason: string };
    const compositionTag = compositionOfVariant(blockName, axes);
    const compositionBonus =
      dna?.composition && compositionTag && dna.composition === compositionTag ? 1 : 0;
    switch (blockName) {
      case "hero": scoredBy = scoreHero(axes, context.genre, content, dna, direction, context.brandCta); break;
      case "features": scoredBy = scoreFeatures(axes, context.genre, content, dna, direction); break;
      case "pricing": scoredBy = scorePricing(axes, context.genre, content); break;
      case "testimonials": scoredBy = scoreTestimonials(axes, context.genre, content, dna, direction); break;
      case "cta": scoredBy = scoreCta(axes, heroFirst ?? "center", context.genre); break;
      case "stats-row": scoredBy = scoreStatsRow(axes, content, context.genre); break;
      case "logo-cloud": scoredBy = scoreLogoCloud(axes, context.genre, content, dna); break;
      case "stats-band": scoredBy = scoreStatsBand(axes, content, context.genre); break;
      case "faq": scoredBy = scoreFaq(axes, content, context.genre); break;
      case "newsletter-signup": scoredBy = scoreNewsletter(axes, heroFirst ?? "center", context.genre); break;
      case "site-footer": scoredBy = scoreFooter(axes, content, context.genre, dna, direction); break;
      case "auth-login": scoredBy = scoreAuth(axes, blockName, content, dna, direction); break;
      case "auth-signup": scoredBy = scoreAuth(axes, blockName, content, dna, direction); break;
      case "app-shell": scoredBy = scoreAppShell(axes, context.genre, dna); break;
      default: scoredBy = { score: 0, reason: `${blockName}: manifest order (no content rules for this block)` };
    }
    const bonusReason =
      compositionBonus > 0 ? `; composition ${compositionTag} matches DNA` : "";
    return {
      axes,
      score: scoredBy.score + compositionBonus,
      reason: `${scoredBy.reason}${bonusReason}`,
    };
  });
  // Stable sort: ties keep canonical (manifest) order.
  scored.sort((a, b) => b.score - a.score);
  return scored.map(({ axes, reason }) => ({ axes, reason }));
}

// Manifest-order fallback for hero axes when only ranking cta (cta mirrors
// hero; the caller ranks hero separately with the real manifest). Declared
// before rankedVariants uses it at call time.
const HERO_AXES_FALLBACK: AxisSource["axes"] = {
  alignment: { values: ["center", "left"], default: "center" },
  mediaLayout: { values: ["none", "right", "below"], default: "none" },
};

/**
 * Variant selections for every block manifest, in manifest order. Blocks
 * without axes resolve to `{}` with a single-layout reason.
 */
export function selectVariants(
  manifests: AxisSource[],
  context: SelectorContext = NEUTRAL_CONTEXT,
): BlockVariantSelection[] {
  return manifests.map((manifest) => {
    const [top] = rankedVariants(manifest.name, manifest, context);
    return { block: manifest.name, axes: top!.axes, reason: top!.reason };
  });
}

/**
 * The next-ranked variant after `current` — the behind-the-scenes swap for
 * "try a different layout". Always returns a different combination when one
 * exists; wraps around the ranking.
 */
export function nextVariantAxes(
  blockName: string,
  current: Record<string, string>,
  source: AxisSource,
  context: SelectorContext = NEUTRAL_CONTEXT,
): Record<string, string> {
  const ranked = rankedVariants(blockName, source, context);
  const rest = ranked.filter((variant) => !axesEqual(variant.axes, current));
  if (rest.length === 0) return ranked[0]!.axes;
  // An empty current means "manifest defaults" (the catalog render): step
  // past the top-ranked variant when it already matches the defaults, so the
  // first swap is always visible.
  const effective =
    Object.keys(current).length === 0 ? manifestDefaults(source) : current;
  const currentIndex = ranked.findIndex((variant) => axesEqual(variant.axes, effective));
  if (currentIndex === -1) return rest[0]!.axes;
  const next = ranked[(currentIndex + 1) % ranked.length]!;
  if (axesEqual(next.axes, current)) return rest[0]!.axes;
  return next.axes;
}

/** Manifest default axis values (the catalog render). */
function manifestDefaults(source: AxisSource): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const [key, axis] of Object.entries(source.axes)) {
    defaults[key] = String(axis.default);
  }
  return defaults;
}
