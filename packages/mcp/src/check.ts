import { getManifests } from "@arche/registry-core";
import type { Manifest } from "@arche/registry-core";

/**
 * Structured context for `check_placement` (Brief #5 §7). Every field is
 * optional; a rule that references something the context cannot express is
 * reported as not-evaluated, never guessed (Rule 7).
 */
export interface PlacementContext {
  variant?: string;
  purpose?: string;
  primaryActionsInRegion?: number;
  hasConfirmation?: boolean;
  iconOnly?: boolean;
  hasAccessibleLabel?: boolean;
  insideDialog?: boolean;
  targetSizePx?: number;
}

export interface RuleEvaluation {
  id: string;
  verdict: "pass" | "violation" | "not-evaluated";
  reason?: string;
  suggestedAlternative?: string;
}

export interface PlacementVerdict {
  component: string;
  allowed: boolean;
  rules: Array<{ id: string; severity: string; check: string }>;
  evaluation: RuleEvaluation[];
  notEvaluated: string[];
}

function suggestedAlternativeFor(manifest: Manifest, ruleId: string): string | undefined {
  const rule = manifest.standards.rules.find((r) => r.id === ruleId);
  if (!rule) return undefined;
  const text = `${rule.check} ${(manifest.standards.doNotUseWhen ?? []).join(" ")}`;
  const match = /use (?:an? )?([A-Z][A-Za-z ]+?)(?:\s+rather|\s+instead|\)|$)/.exec(text);
  if (match?.[1]) {
    const candidate = match[1].trim();
    if (getManifests().some((m) => m.title === candidate || m.name === candidate.toLowerCase().replace(/\s+/g, "-"))) {
      return candidate;
    }
  }
  // Known cross-component redirects named in doNotUseWhen.
  for (const alt of ["Alert Dialog", "link"]) {
    if (text.toLowerCase().includes(alt.toLowerCase())) return alt;
  }
  return undefined;
}

/** Evaluates one manifest rule against the supplied context. Null = cannot decide. */
function evaluateRule(manifestName: string, ruleId: string, ctx: PlacementContext): boolean | null {
  switch (`${manifestName}:${ruleId}`) {
    case "button:button-no-navigation":
      if (ctx.purpose === undefined) return null;
      return ctx.purpose !== "navigation";
    case "button:button-one-primary":
      if (ctx.primaryActionsInRegion === undefined) return null;
      if ((ctx.variant ?? "default") !== "default") return true;
      return ctx.primaryActionsInRegion <= 1;
    case "button:button-destructive-confirm":
      if ((ctx.variant ?? "") !== "destructive") return true;
      if (ctx.hasConfirmation === undefined) return null;
      return ctx.hasConfirmation === true;
    case "dialog:dialog-requires-title":
      if (ctx.hasAccessibleLabel === undefined) return null;
      return ctx.hasAccessibleLabel === true;
    case "dialog:dialog-no-nesting":
      if (ctx.insideDialog === undefined) return null;
      return ctx.insideDialog === false;
    case "dialog:dialog-not-longform":
      // No length signal in the context schema: never guess.
      return null;
    case "dialog:dialog-destructive-use-alert-dialog":
      if (ctx.variant === undefined && ctx.purpose === undefined) return null;
      // A destructive confirmation belongs in Alert Dialog, not Dialog.
      if (ctx.variant === "destructive" || ctx.purpose === "confirmation") return false;
      return true;
    default:
      // Rules from the wider catalog have no structured evaluator yet:
      // surface them as not-evaluated rather than silently passing.
      return null;
  }
}

export function checkPlacement(component: string, ctx: PlacementContext): PlacementVerdict {
  const manifest = getManifests().find((m) => m.name === component);
  if (!manifest) {
    throw new Error(`unknown component '${component}'`);
  }
  const evaluation: RuleEvaluation[] = [];
  for (const rule of manifest.standards.rules) {
    const decided = evaluateRule(manifest.name, rule.id, ctx);
    if (decided === null) {
      evaluation.push({ id: rule.id, verdict: "not-evaluated", reason: "context insufficient to decide this rule" });
    } else if (decided) {
      evaluation.push({ id: rule.id, verdict: "pass" });
    } else {
      evaluation.push({
        id: rule.id,
        verdict: "violation",
        reason: rule.check,
        ...(suggestedAlternativeFor(manifest, rule.id)
          ? { suggestedAlternative: suggestedAlternativeFor(manifest, rule.id) }
          : {}),
      });
    }
  }
  return {
    component,
    allowed: !evaluation.some((e) => e.verdict === "violation"),
    rules: manifest.standards.rules,
    evaluation,
    notEvaluated: evaluation.filter((e) => e.verdict === "not-evaluated").map((e) => e.id),
  };
}
