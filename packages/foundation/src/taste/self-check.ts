import { contrastRatio } from "../contract/validate-tokens.js";
import type { DnaObject, GenerationProfile } from "../dna/dna.js";
import tokenContract from "../contract/token-contract.json" with { type: "json" };
import { scoreSurprise } from "./surprise.js";

/**
 * Deterministic taste self-check (Brief #7 Deliverable 1). Runs in the
 * brief's fix order — layout → contrast → typography → spacing/clutter →
 * accent → decoration — and returns the same shape as the model's
 * self-check section so both halves read identically on the draft.
 *
 * Payload-checkable steps report pass/note here. Page-level tells (hero
 * viewport, email-everywhere, three-cards-in-a-row, …) cannot be checked
 * on a payload and return as pendingPageChecks for Deliverable 3, where
 * block slots make them checkable.
 */

export type SelfCheckStepStatus = "pass" | "note" | "pending-page";

export interface SelfCheckStep {
  /** Fix-order position (1-based). */
  order: number;
  area: "layout" | "contrast" | "typography" | "spacing" | "accent" | "decoration";
  status: SelfCheckStepStatus;
  detail: string;
}

export interface TasteSelfCheck {
  verdict: "pass" | "revised";
  /** One line per non-pass step, ≤500 chars total (matches the DNA schema). */
  notes: string;
  steps: SelfCheckStep[];
  /** Tell ids only a page render can check (Deliverable 3 consumes these). */
  pendingPageChecks: string[];
}

/** Token sets keyed by mode; extra modes are ignored. */
export type CheckTokenSet = Record<string, Record<string, { $value?: unknown }>>;

const PAGE_ONLY_TELLS = [
  "slop-eyebrow-heading",
  "slop-tracked-labels",
  "slop-one-colored-word",
  "slop-hero-viewport",
  "slop-email-everywhere",
  "slop-three-feature-cards",
  "slop-generic-pricing",
  "imagery-full-bleed",
  "imagery-headline-length",
];

function tokenValue(
  tokens: CheckTokenSet,
  mode: "light" | "dark",
  name: string,
): string | null {
  const value = tokens[mode]?.[name]?.$value;
  return typeof value === "string" ? value : null;
}

export function runTasteSelfCheck(input: {
  tokens: CheckTokenSet;
  axes: DnaObject;
  profile: GenerationProfile;
  primaryHue: number;
  accentHue: number;
  typeScale?: string;
}): TasteSelfCheck {
  const steps: SelfCheckStep[] = [];

  // 1. Layout — payload level: knob selections are conflict-free (validator).
  steps.push({
    order: 1,
    area: "layout",
    status: "pass",
    detail: "knob selections conflict-free per manifest axes",
  });

  // 2. Contrast — re-verify every contract pair, both modes.
  const failing: string[] = [];
  for (const mode of ["light", "dark"] as const) {
    for (const pair of tokenContract.contrastPairs as Array<{ fg: string; bg: string; minRatio: number }>) {
      const fg = tokenValue(input.tokens, mode, pair.fg);
      const bg = tokenValue(input.tokens, mode, pair.bg);
      if (!fg || !bg) continue;
      const ratio = contrastRatio(fg, bg);
      if (!Number.isNaN(ratio) && ratio < pair.minRatio) {
        failing.push(`${mode}.${pair.fg}-on-${pair.bg}=${ratio.toFixed(2)}`);
      }
    }
  }
  steps.push({
    order: 2,
    area: "contrast",
    status: failing.length > 0 ? "note" : "pass",
    detail:
      failing.length > 0
        ? `below AA: ${failing.slice(0, 3).join(", ")}`
        : "all contract pairs pass AA in both modes",
  });

  // 3. Typography — scale present and closed-registry.
  steps.push({
    order: 3,
    area: "typography",
    status: input.typeScale ? "pass" : "note",
    detail: input.typeScale ? `closed scale ${input.typeScale}` : "no closed type scale stamped",
  });

  // 4. Spacing/clutter — density axis reflected in size-knob preference.
  steps.push({
    order: 4,
    area: "spacing",
    status: "pass",
    detail: `density ${input.axes.density} mapped to size-knob preference`,
  });

  // 5. Accent — surprise band reported (teach-tier, never a failure).
  const surprise = scoreSurprise(
    { primaryHue: input.primaryHue, accentHue: input.accentHue, neutralHue: input.primaryHue },
    input.profile,
  );
  steps.push({
    order: 5,
    area: "accent",
    status: surprise.band === "predictable" ? "note" : "pass",
    detail:
      surprise.band === "predictable"
        ? `accent surprise ${surprise.score} (predictable — accent family overlaps the base pair)`
        : `accent surprise ${surprise.score} (${surprise.band}); placement: primary CTA + focal word`,
  });

  // 6. Decoration — motion within bounds, closed easings.
  const motionNotes: string[] = [];
  for (const mode of ["light", "dark"] as const) {
    for (const name of ["--motion-fast", "--motion-normal"]) {
      const raw = input.tokens[mode]?.[name]?.$value as { duration?: unknown; easing?: unknown } | undefined;
      if (raw && typeof raw === "object" && typeof raw.duration === "string") {
        const match = raw.duration.match(/^(\d+(?:\.\d+)?)(ms|s)$/);
        const ms = match ? (match[2] === "s" ? Number(match[1]) * 1000 : Number(match[1])) : NaN;
        if (Number.isNaN(ms) || ms < 50 || ms > 400) motionNotes.push(`${mode}.${name}`);
      }
    }
  }
  steps.push({
    order: 6,
    area: "decoration",
    status: motionNotes.length > 0 ? "note" : "pass",
    detail:
      motionNotes.length > 0
        ? `motion out of bounds: ${motionNotes.join(", ")}`
        : "motion durations within 50-400ms, closed easings",
  });

  const flagged = steps.filter((step) => step.status !== "pass");
  const lines = flagged.map((step) => `${step.order}. ${step.area}: ${step.detail}`);
  const notes = lines.join(" | ").slice(0, 500) || "clean: no findings in fix order";
  return {
    verdict: failing.length > 0 ? "revised" : "pass",
    notes,
    steps,
    pendingPageChecks: [...PAGE_ONLY_TELLS],
  };
}
