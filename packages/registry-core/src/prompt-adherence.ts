/**
 * Prompt-adherence layer: words → numeric constraints → deterministic
 * enforcement → verifier. Code decides, the model suggests.
 *
 * Deterministic: same prompt + same compilerVersion → same constraints,
 * same payload. The model is the only nondeterministic step.
 */
import { readFileSync } from "node:fs";
import { contrastRatio } from "@arche/foundation/contract/validate-tokens";
import type { ArcheIdentity } from "./index.js";
import { resolveRuntimeAsset } from "./runtime-assets.js";

export interface PromptConstraints {
  chromaCap?: number;
  chromaFloorAccent?: number;
  hueSpreadMax?: number;
  hueFamily?: number;
  lightness?: "light" | "dark";
  radiusBand?: "sharp" | "balanced" | "soft";
  /** Warmth hint 0-1 (warm >= 0.7, cool <= 0.3). Feeds slots + provider wording. */
  warmth?: number;
}

interface KeywordTable {
  version: number;
  groups: Record<string, string[]>;
  namedHues: Record<string, number>;
}

const KEYWORD_FILE = resolveRuntimeAsset(["prompt-keywords.json"]);

let cachedTable: KeywordTable | null = null;

/** Loads the keyword table (data file, not code — tests pin its contents). */
export function loadKeywordTable(): KeywordTable {
  if (!cachedTable) {
    cachedTable = JSON.parse(readFileSync(KEYWORD_FILE, "utf8")) as KeywordTable;
  }
  return cachedTable;
}

function TABLE(): KeywordTable {
  return loadKeywordTable();
}

function normPrompt(prompt: string): string {
  return ` ${prompt.toLowerCase().replace(/[_—–-]+/g, " ").replace(/\s+/g, " ")} `;
}

function hasPhrase(haystack: string, phrase: string): boolean {
  const needle = phrase.toLowerCase().trim();
  if (!needle) return false;
  if (!needle.includes(" ")) {
    return new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(haystack);
  }
  return haystack.includes(` ${needle} `);
}

function groupHit(prompt: string, group: string): boolean {
  const list = TABLE().groups[group] ?? [];
  return list.some((kw) => hasPhrase(prompt, kw));
}

/**
 * Deterministic keyword + phrase parser. No model call, no network.
 * Empty object when nothing matches — downstream behaves exactly as today.
 */
export function parseConstraints(prompt: string): PromptConstraints {
  const out: PromptConstraints = {};
  const hay = normPrompt(prompt);
  if (!hay.trim()) return out;

  if (groupHit(hay, "monochrome")) {
    out.chromaCap = 0.02;
    out.hueSpreadMax = 10;
  }
  if (groupHit(hay, "vivid")) {
    out.chromaFloorAccent = 0.15;
  }
  if (groupHit(hay, "warm")) out.warmth = 0.85;
  else if (groupHit(hay, "cool")) out.warmth = 0.15;

  if (groupHit(hay, "dark")) out.lightness = "dark";
  else if (groupHit(hay, "light")) out.lightness = "light";

  if (groupHit(hay, "sharp")) out.radiusBand = "sharp";
  else if (groupHit(hay, "soft")) out.radiusBand = "soft";
  else if (groupHit(hay, "balanced")) out.radiusBand = "balanced";

  // Named hues: first color word in prompt order wins (deterministic:
  // table insertion order). Matches "red brand", "deep teal", bare "blue".
  const entries = Object.entries(TABLE().namedHues);
  let bestIdx = Infinity;
  let bestHue: number | undefined;
  for (const [name, hue] of entries) {
    const re = new RegExp(`\\b${name}\\b`);
    const m = re.exec(hay);
    if (m && m.index < bestIdx) {
      bestIdx = m.index;
      bestHue = hue;
    }
  }
  if (bestHue !== undefined) out.hueFamily = bestHue;
  return out;
}

/** Human-readable slots for the picker step 1 + Studio ("Understood: …"). */
export function describeConstraints(c: PromptConstraints): string {
  if (Object.keys(c).length === 0) return "free brief";
  const parts: string[] = [];
  if (c.chromaCap !== undefined && c.chromaCap <= 0.02) parts.push("monochromatic");
  else if (c.chromaCap !== undefined) parts.push(`chroma ≤ ${c.chromaCap}`);
  if (c.chromaFloorAccent !== undefined) parts.push("vivid accents");
  if (c.hueFamily !== undefined) {
    const name =
      Object.entries(TABLE().namedHues).find(([, h]) => h === c.hueFamily)?.[0] ?? `${c.hueFamily}°`;
    parts.push(`${name} family`);
  }
  if (c.hueSpreadMax !== undefined && c.chromaCap !== undefined && c.chromaCap <= 0.02)
    parts.push("near-zero chroma");
  else if (c.hueSpreadMax !== undefined) parts.push(`hue spread ≤ ${c.hueSpreadMax}°`);
  if (c.lightness) parts.push(c.lightness);
  if (c.radiusBand) parts.push(`${c.radiusBand} radius`);
  if (c.warmth !== undefined) parts.push(c.warmth >= 0.5 ? "warm" : "cool");
  return parts.join(" · ");
}

/** Slot list form for the picker UI. */
export function constraintSlots(c: PromptConstraints): string[] {
  return describeConstraints(c)
    .split(" · ")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// OKLCH helpers (local copies — compiler owns the canonical ones)
// ---------------------------------------------------------------------------

interface Oklch {
  l: number;
  c: number;
  h: number;
  alpha?: string;
}

function parseOklch(value: string): Oklch | null {
  const m = value.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)$/);
  if (!m) return null;
  return { l: Number(m[1]), c: Number(m[2]), h: Number(m[3]), alpha: m[4] };
}

function fmt(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}

function formatOklch(v: Oklch): string {
  const body = `${fmt(v.l)} ${fmt(v.c)} ${fmt(v.h)}`;
  return v.alpha === undefined ? `oklch(${body})` : `oklch(${body} / ${v.alpha})`;
}

export interface EnforcementAdjustment {
  mode: string;
  token: string;
  compiledValue: string;
  adjustedValue: string;
  ruleId: string;
}

function circDist(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return Math.min(d, 360 - d);
}

/**
 * Enforces parsed prompt constraints over compiled mode tokens.
 * Runs AFTER design repair, BEFORE the AA pass (AA only moves lightness,
 * so caps survive it). Every action is logged with a prompt-* rule id.
 */
export interface EnforcementOptions {
  /**
   * Palette-row brand strategy riding along (unified | mark-only | accent).
   * The mark-only ink structure is stamped strategy intent (like
   * monochrome): the vivid-accent floor governs accents, never the ink it
   * defines itself by — boosting it breaks the chroma taper.
   */
  brandStrategy?: string;
  /**
   * True when the compile's brand hue is an explicit user pick (brand tile,
   * custom hex), not the dreamed answer: the prompt's hue family governed
   * the dreamed choice, and the pick IS the new family — the family snap is
   * skipped so alternatives render truthfully instead of collapsing back.
   */
  preservePickedHues?: boolean;
}

export function enforceConstraints(
  tokens: Record<string, Record<string, { $type: string; $value: unknown }>>,
  constraints: PromptConstraints,
  profile: "enterprise" | "standard" | "expressive",
  adjustments: EnforcementAdjustment[],
  options: EnforcementOptions = {},
): void {
  if (Object.keys(constraints).length === 0) return;
  const ceiling = profile === "enterprise" ? 0.19 : profile === "expressive" ? 0.26 : 0.24;
  const modes = ["light", "dark"] as const;

  // 1. Monochrome state first: cap <= 0.02 forces exactly C = 0 everywhere.
  if (constraints.chromaCap !== undefined && constraints.chromaCap <= 0.02) {
    for (const mode of modes) {
      const set = tokens[mode]!;
      for (const [name, entry] of Object.entries(set)) {
        if (typeof entry.$value !== "string" || !entry.$value.startsWith("oklch(")) continue;
        const parsed = parseOklch(entry.$value);
        if (!parsed || parsed.c === 0) continue;
        const before = String(entry.$value);
        parsed.c = 0;
        entry.$value = formatOklch(parsed);
        adjustments.push({
          mode,
          token: name,
          compiledValue: before,
          adjustedValue: String(entry.$value),
          ruleId: "prompt-monochrome-chroma-cap",
        });
      }
    }
    return; // zero subsumes every other chroma/hue rule
  }

  // 2. Generic chroma cap (clamp every token).
  if (constraints.chromaCap !== undefined) {
    const cap = constraints.chromaCap;
    for (const mode of modes) {
      const set = tokens[mode]!;
      for (const [name, entry] of Object.entries(set)) {
        if (typeof entry.$value !== "string" || !entry.$value.startsWith("oklch(")) continue;
        const parsed = parseOklch(entry.$value);
        if (!parsed || parsed.c <= cap) continue;
        const before = String(entry.$value);
        parsed.c = Math.floor(Math.min(cap, 0.4) * 1000) / 1000;
        entry.$value = formatOklch(parsed);
        adjustments.push({
          mode,
          token: name,
          compiledValue: before,
          adjustedValue: String(entry.$value),
          ruleId: "prompt-monochrome-chroma-cap",
        });
      }
    }
  }

  // 3. Accent floor: raise primary/accent solids (never above ceiling).
  if (constraints.chromaFloorAccent !== undefined) {
    const floor = Math.min(constraints.chromaFloorAccent, ceiling);
    // Mark-only exempt on --primary: its achromatic ink structure is the
    // strategy (stamped intent, like monochrome) — the floor governs the
    // accent, which here is the brand lifted one step (full mark voice),
    // so intent is satisfied.
    const floored = options.brandStrategy === "mark-only" ? ["--accent"] : ["--primary", "--accent"];
    for (const mode of modes) {
      const set = tokens[mode]!;
      for (const name of floored) {
        const entry = set[name];
        if (!entry || typeof entry.$value !== "string" || !entry.$value.startsWith("oklch(")) continue;
        const parsed = parseOklch(entry.$value);
        if (!parsed || parsed.c >= floor) continue;
        const before = String(entry.$value);
        parsed.c = Math.round(floor * 1000) / 1000;
        entry.$value = formatOklch(parsed);
        adjustments.push({
          mode,
          token: name,
          compiledValue: before,
          adjustedValue: String(entry.$value),
          ruleId: "prompt-accent-floor",
        });
      }
    }
  }

  // 4. Hue-family snap: rotate primary/accent/brand families toward the
  // anchor when more than 30° away. Brand included (Brand Token brief §3):
  // a family constraint governs the brand too. --brand-foreground is
  // near-neutral text and falls below the chroma floor, so it never snaps.
  // Skipped for explicit picks: the picked hue IS the new family, and
  // snapping it back would make every alternative render as the dreamed
  // color (and silently discard custom hex choices at finish).
  if (constraints.hueFamily !== undefined && options.preservePickedHues !== true) {
    const anchor = ((constraints.hueFamily % 360) + 360) % 360;
    const families: Record<string, string[]> = {
      primary: ["--primary", "--secondary", "--ring"],
      accent: ["--accent"],
      brand: ["--brand"],
    };
    for (const mode of modes) {
      const set = tokens[mode]!;
      for (const names of Object.values(families)) {
        for (const name of names) {
          const entry = set[name];
          if (!entry || typeof entry.$value !== "string" || !entry.$value.startsWith("oklch(")) continue;
          const parsed = parseOklch(entry.$value);
          if (!parsed || parsed.c < 0.015 || circDist(parsed.h, anchor) <= 30) continue;
          const before = String(entry.$value);
          parsed.h = Math.round(anchor * 1000) / 1000;
          entry.$value = formatOklch(parsed);
          adjustments.push({
            mode,
            token: name,
            compiledValue: before,
            adjustedValue: String(entry.$value),
            ruleId: "prompt-hue-snap",
          });
        }
      }
      // Charts are intentionally left alone: the family constraint governs
      // the brand (primary/accent), while charts keep the compiler's
      // separated hues — snapping them onto one family creates collisions
      // the lightness-only chart repair cannot always separate.
    }
  }
}

// ---------------------------------------------------------------------------
// Verifier (pure code — never the model judging itself)
// ---------------------------------------------------------------------------

export interface AdherenceReport {
  pass: boolean;
  failures: string[];
  metrics: {
    maxChroma: number;
    meanChroma: number;
    accentChroma: number;
    primaryHue: number | null;
    accentHue: number | null;
    hueSpread: number;
    minContrast: number;
  };
}

function tokenOklch(tokens: ArcheIdentity["tokens"], mode: string, name: string): Oklch | null {
  const set = (tokens as Record<string, Record<string, { $value?: unknown }>>)[mode];
  const entry = set?.[name];
  if (!entry || typeof entry.$value !== "string") return null;
  return parseOklch(entry.$value);
}

export function verifyAdherence(
  identity: ArcheIdentity,
  constraints: PromptConstraints,
): AdherenceReport {
  const failures: string[] = [];
  let maxChroma = 0;
  let sum = 0;
  let count = 0;
  for (const mode of ["light", "dark"] as const) {
    const set = (identity.tokens as Record<string, Record<string, { $value?: unknown }>>)[mode] ?? {};
    for (const entry of Object.values(set)) {
      if (entry && typeof entry.$value === "string" && entry.$value.startsWith("oklch(")) {
        const p = parseOklch(entry.$value);
        if (!p) continue;
        maxChroma = Math.max(maxChroma, p.c);
        sum += p.c;
        count++;
      }
    }
  }
  const meanChroma = count === 0 ? 0 : sum / count;
  const primary = tokenOklch(identity.tokens, "light", "--primary");
  const accent = tokenOklch(identity.tokens, "light", "--accent");
  const accentChroma = accent?.c ?? 0;
  const hueSpread =
    primary && accent ? circDist(primary.h, accent.h) : 0;

  // WCAG: every contract contrast pair in both modes.
  let minContrast = Infinity;
  const pairs: Array<[string, string]> = [
    ["--primary-foreground", "--primary"],
    ["--secondary-foreground", "--secondary"],
    ["--accent-foreground", "--accent"],
    ["--destructive-foreground", "--destructive"],
    ["--brand-foreground", "--brand"],
    ["--card-foreground", "--card"],
    ["--popover-foreground", "--popover"],
    ["--foreground", "--background"],
    ["--muted-foreground", "--muted"],
  ];
  for (const mode of ["light", "dark"] as const) {
    for (const [fg, bg] of pairs) {
      const f = tokenOklch(identity.tokens, mode, fg);
      const b = tokenOklch(identity.tokens, mode, bg);
      if (!f || !b) continue;
      const r = contrastRatio(
        `oklch(${f.l} ${f.c} ${f.h})`,
        `oklch(${b.l} ${b.c} ${b.h})`,
      );
      if (!Number.isNaN(r)) minContrast = Math.min(minContrast, r);
    }
  }
  if (!Number.isFinite(minContrast)) minContrast = 0;

  if (constraints.chromaCap !== undefined && maxChroma > constraints.chromaCap + 1e-9) {
    failures.push(
      `max chroma ${Math.round(maxChroma * 1000) / 1000} exceeds the ${constraints.chromaCap} cap`,
    );
  }
  if (constraints.chromaFloorAccent !== undefined && accentChroma + 1e-9 < constraints.chromaFloorAccent) {
    failures.push(
      `accent chroma ${Math.round(accentChroma * 1000) / 1000} is below the ${constraints.chromaFloorAccent} floor`,
    );
  }
  if (
    constraints.hueSpreadMax !== undefined &&
    primary &&
    accent &&
    primary.c >= 0.015 &&
    accent.c >= 0.015 &&
    hueSpread > constraints.hueSpreadMax + 1e-9
  ) {
    failures.push(`hue spread ${Math.round(hueSpread * 10) / 10}° exceeds the ${constraints.hueSpreadMax}° cap`);
  }
  if (minContrast + 1e-9 < 4.5) {
    failures.push(`minimum text contrast ${Math.round(minContrast * 100) / 100} is below AA 4.5:1`);
  }

  return {
    pass: failures.length === 0,
    failures,
    metrics: {
      maxChroma: Math.round(maxChroma * 1000) / 1000,
      meanChroma: Math.round(meanChroma * 1000) / 1000,
      accentChroma: Math.round(accentChroma * 1000) / 1000,
      primaryHue: primary ? Math.round(primary.h * 10) / 10 : null,
      accentHue: accent ? Math.round(accent.h * 10) / 10 : null,
      hueSpread: Math.round(hueSpread * 10) / 10,
      minContrast: Math.round(minContrast * 100) / 100,
    },
  };
}

// ---------------------------------------------------------------------------
// Corpus retrieval (tag overlap + optional embedding cosine)
// ---------------------------------------------------------------------------

export interface CorpusEntry {
  id: string;
  prompt: string;
  axes: Record<string, unknown>;
  palette: { primaryHue: number; accentHue: number; neutralHue: number };
  tags: { chromaBand: string; hueFamily: string; lightness: string; archetype: string };
}

function tagOverlapScore(a: PromptConstraints, entry: CorpusEntry): number {
  let score = 0;
  const wantMono = a.chromaCap !== undefined && a.chromaCap <= 0.02;
  const wantVivid = a.chromaFloorAccent !== undefined;
  if (wantMono && entry.tags.chromaBand === "muted") score += 2;
  if (!wantMono && wantVivid && entry.tags.chromaBand === "vivid") score += 2;
  if (!wantMono && !wantVivid && entry.tags.chromaBand === "balanced") score += 1;
  if (a.hueFamily !== undefined) {
    const names = Object.entries(TABLE().namedHues);
    const want = names.find(([, h]) => h === a.hueFamily)?.[0];
    if (want && entry.tags.hueFamily === want) score += 2;
    else if (entry.tags.hueFamily === "neutral" && wantMono) score += 1;
  } else if (entry.tags.hueFamily === "neutral" && wantMono) score += 1;
  if (a.lightness && entry.tags.lightness === a.lightness) score += 1;
  return score;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Nearest 1–3 corpus entries. Tag overlap always runs; embedding cosine
 * blends in only when the caller supplies vectors. Below the similarity
 * threshold → empty (generate without exemplars rather than a wrong base).
 */
export function retrieveExemplars(
  constraints: PromptConstraints,
  corpus: CorpusEntry[],
  embeddings?: { promptVector: number[]; entryVectors: Map<string, number[]> },
  threshold = 1,
  limit = 3,
): CorpusEntry[] {
  const scored = corpus.map((entry) => {
    let score = tagOverlapScore(constraints, entry);
    if (embeddings) {
      const v = embeddings.entryVectors.get(entry.id);
      if (v) score += cosine(embeddings.promptVector, v) * 2;
    }
    return { entry, score };
  });
  scored.sort((x, y) => y.score - x.score || x.entry.id.localeCompare(y.entry.id));
  const picked = scored.filter((s) => s.score >= threshold).slice(0, limit);
  return picked.map((s) => s.entry);
}

export function keywordTableVersion(): number {
  return loadKeywordTable().version;
}

const CORPUS_FILE = resolveRuntimeAsset(["generation", "corpus.json"]);

let cachedCorpus: CorpusEntry[] | null = null;

/** Loads the exemplar corpus (prompt → DNA v2 pairs, Brief seeded + extended). */
export function loadCorpus(): CorpusEntry[] {
  if (!cachedCorpus) {
    const raw = JSON.parse(readFileSync(CORPUS_FILE, "utf8")) as {
      entries: CorpusEntry[];
    };
    cachedCorpus = raw.entries;
  }
  return cachedCorpus;
}

/** Corpus version (entries count, for logs). */
export function corpusVersion(): number {
  return loadCorpus().length;
}
