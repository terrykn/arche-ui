/**
 * Single-call flow test (Deliverable 3 + acceptance 3): with a stubbed
 * provider, a compliant generation triggers exactly ONE provider call, and
 * the taught system-prompt block is byte-identical across calls and built
 * from the design-rules registry. The retry path (invalid → 2 calls) shown.
 * Usage: ../../packages/foundation/node_modules/.bin/tsx --env-file=.env.local scripts/test-single-call.ts
 */
import assert from "node:assert/strict";
import { generateDna, generateDnaDelta } from "../lib/generation/provider";
import type { DnaObject } from "@arche/registry-core";

process.env.LLM_PROVIDER = "groq";
process.env.LLM_MODEL = "openai/gpt-oss-120b";
process.env.LLM_API_KEY = "stub-key";

const AXES: DnaObject = {
  warmth: 0.5, energy: 0.5, playfulness: 0.5, sharpness: 0.5,
  density: 0.5, ornament: 0.5, retroFuturism: 0.2, formality: 0.4, chroma: 0.5,
  material: "metal", motionFeel: "smooth", texture: "grain",
  minContrast: "AA", respectReducedMotion: true,
};
const COMPLIANT = {
  plan: { colors: [
    { name: "Ember", role: "primary" }, { name: "Coal", role: "background" },
    { name: "Ash", role: "neutral" }, { name: "Spark", role: "accent" },
  ] },
  selfCheck: { verdict: "pass", notes: "Plan uses one primary family plus one accent; neutrals tinted; backgrounds near-neutral." },
  axes: AXES,
  palette: { primaryHue: 20, accentHue: 200, neutralHue: 40 },
  profile: "standard",
};

let calls = 0;
const systems: string[] = [];
let script: Array<unknown> = [COMPLIANT];

(globalThis as Record<string, unknown>).fetch = async (_url: unknown, init: unknown) => {
  calls++;
  const body = JSON.parse(String((init as { body: string }).body));
  systems.push(String(body.messages[0].content));
  const next = script[Math.min(calls - 1, script.length - 1)];
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(next) } }],
      usage: { prompt_tokens: 900, completion_tokens: 400 },
    }),
  };
};

// 1. Compliant generation: exactly one provider call.
const first = await generateDna("ember glow");
assert.equal(calls, 1, `compliant generation must cost exactly one call (got ${calls})`);
assert.equal(first.profile, "standard");
assert.equal(first.plan.colors.length, 4);
assert.equal(first.selfCheck.verdict, "pass");
assert.deepEqual(first.output.palette, COMPLIANT.palette);

// 2. Teach block: byte-identical across calls, registry-built.
const second = await generateDna("ember glow");
assert.equal(calls, 2);
assert.equal(systems[0], systems[1], "taught system block byte-identical across calls");
assert.ok(systems[0]!.includes("[color-step-jobs]"), "system prompt carries registry teach statements");
assert.ok(systems[0]!.includes("Arche design rules v1"), "system prompt carries the rules version");

// 3. Retry path: invalid first reply → exactly one follow-up, then success.
calls = 0;
systems.length = 0;
script = [{ axes: AXES }, COMPLIANT];
const third = await generateDna("ember glow");
assert.equal(calls, 2, `invalid output retries exactly once (got ${calls})`);
assert.equal(third.profile, "standard");

// 4. Prompt edit: same single-call shape.
calls = 0;
script = [{
  plan: COMPLIANT.plan,
  selfCheck: { verdict: "revised", notes: "Warmer per the edit; unrelated fields omitted." },
  delta: { axes: { warmth: 0.8 } },
  profile: "expressive",
}];
const edit = await generateDnaDelta({ axes: AXES, palette: COMPLIANT.palette, profile: "standard" }, "warmer");
assert.equal(calls, 1, "prompt edit costs exactly one call");
assert.deepEqual(edit.delta, { axes: { warmth: 0.8 } });
assert.equal(edit.profile, "expressive");
assert.equal(edit.selfCheck.verdict, "revised");

console.log("SINGLE_CALL: all 4 pass (1-call compliant, byte-stable prompt, 1-retry, 1-call edit)");
