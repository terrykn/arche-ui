/**
 * Version timeline summaries (Part 5.3): plain-language "what changed"
 * between consecutive published payloads. Deterministic, no model calls.
 */
export interface PayloadLite {
  tokens?: Record<string, Record<string, { $value?: unknown } | string>>;
  components?: Record<string, Record<string, unknown>>;
  typeScale?: string;
  dna?: { profile?: string };
}

function tokenString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const inner = (v as { $value?: unknown }).$value ?? v;
    if (typeof inner === "string") return inner;
    if (inner && typeof inner === "object") {
      const rec = inner as Record<string, unknown>;
      if (typeof rec.duration === "string") return `${rec.duration} ${typeof rec.easing === "string" ? rec.easing : ""}`.trim();
      return JSON.stringify(inner);
    }
  }
  return String(v ?? "");
}

/** Summarize what changed from prev → next. Empty prev means first publish. */
export function summarizeChanges(prev: PayloadLite | null, next: PayloadLite): string[] {
  if (!prev) return ["First published version."];
  const lines: string[] = [];

  const prevProfile = prev.dna?.profile ?? "standard";
  const nextProfile = next.dna?.profile ?? "standard";
  if (prevProfile !== nextProfile) {
    lines.push(`Profile changed: ${prevProfile} → ${nextProfile}.`);
  }
  if ((prev.typeScale ?? null) !== (next.typeScale ?? null)) {
    lines.push(`Type scale changed: ${prev.typeScale ?? "unset"} → ${next.typeScale ?? "unset"}.`);
  }

  const changedTokens: string[] = [];
  const modes = new Set([...Object.keys(prev.tokens ?? {}), ...Object.keys(next.tokens ?? {})]);
  const names = new Set<string>();
  for (const mode of modes) {
    for (const name of Object.keys(prev.tokens?.[mode] ?? {})) names.add(name);
    for (const name of Object.keys(next.tokens?.[mode] ?? {})) names.add(name);
  }
  for (const name of [...names].sort()) {
    let changed = false;
    for (const mode of modes) {
      const a = prev.tokens?.[mode]?.[name];
      const b = next.tokens?.[mode]?.[name];
      if (a === undefined && b === undefined) continue;
      if (tokenString(a) !== tokenString(b)) {
        changed = true;
        break;
      }
    }
    if (changed) changedTokens.push(name);
  }
  if (changedTokens.length > 0) {
    const shown = changedTokens.slice(0, 5).join(", ");
    lines.push(
      changedTokens.length === 1
        ? `1 token changed (${shown}).`
        : `${changedTokens.length} tokens changed (${shown}${changedTokens.length > 5 ? ", …" : ""}).`,
    );
  }

  const changedKnobs: string[] = [];
  const components = new Set([...Object.keys(prev.components ?? {}), ...Object.keys(next.components ?? {})]);
  for (const component of [...components].sort()) {
    const a = prev.components?.[component] ?? {};
    const b = next.components?.[component] ?? {};
    const knobs = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const knob of [...knobs].sort()) {
      if (JSON.stringify(a[knob]) !== JSON.stringify(b[knob])) {
        changedKnobs.push(`${component} ${knob}: ${JSON.stringify(a[knob]) ?? "unset"} → ${JSON.stringify(b[knob]) ?? "unset"}`);
      }
    }
  }
  for (const line of changedKnobs.slice(0, 4)) lines.push(`Knob ${line}.`);
  if (changedKnobs.length > 4) lines.push(`${changedKnobs.length - 4} more knob changes.`);

  if (lines.length === 0) return ["Republished with no payload changes."];
  return lines;
}
