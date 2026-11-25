/**
 * Single-call flow test (Brief #8 acceptance 5): with a stubbed
 * provider, a compliant generation triggers exactly ONE provider call, and
 * the taught system-prompt block is byte-identical across calls and built
 * from the design-rules registry. The retry path (invalid → 2 calls) shown.
 * Usage: ../../packages/foundation/node_modules/.bin/tsx --env-file=.env.local scripts/test-single-call.ts
 */
import assert from "node:assert/strict";
import { deriveProfile } from "@arche-ui/registry-core";
import { generateDna, generateDnaDelta } from "../lib/generation/provider";
import type { DnaObject } from "@arche-ui/registry-core";

process.env.LLM_PROVIDER = "groq";
process.env.LLM_MODEL = "openai/gpt-oss-120b";
process.env.LLM_API_KEY = "stub-key";

const AXES: DnaObject = {
  warmth: 0.5, chroma: 0.5, energy: 0.5, playfulness: 0.5, sharpness: 0.5,
  density: 0.5, ornament: 0.5, formality: 0.4,
  material: "metal", motionFeel: "smooth", texture: "grain",
  minContrast: "AA", respectReducedMotion: true,
};
const COMPLIANT = {
  axes: AXES,
  palette: { primaryHue: 20, accentHue: 200, neutralHue: 40 },
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

// 1. Compliant generation: exactly one provider call, DNA only.
const first = await generateDna("ember glow");
assert.equal(calls, 1, `compliant generation must cost exactly one call (got ${calls})`);
assert.equal(deriveProfile(first.output.axes), "standard");
assert.deepEqual(first.output.palette, COMPLIANT.palette);
assert.ok(!("plan" in first.output), "no plan in DNA output");
assert.ok(!("profile" in first.output), "no profile in DNA output");

// 2. Teach block: byte-identical across calls, registry-built.
const second = await generateDna("ember glow");
assert.equal(calls, 2);
assert.equal(systems[0], systems[1], "taught system block byte-identical across calls");
assert.ok(systems[0]!.includes("[color-step-jobs]"), "system prompt carries registry teach statements");

// 3. Retry path: invalid first reply → exactly one follow-up, then success.
calls = 0;
systems.length = 0;
script = [{ axes: AXES }, COMPLIANT];
const third = await generateDna("ember glow");
assert.equal(calls, 2, `invalid output retries exactly once (got ${calls})`);
assert.deepEqual(third.output.palette, COMPLIANT.palette);

// 4. Non-JSON first reply → exactly one follow-up (retry-path fix).
calls = 0;
(globalThis as Record<string, unknown>).fetch = async (_url: unknown, init: unknown) => {
  calls++;
  const body = JSON.parse(String((init as { body: string }).body));
  systems.push(String(body.messages[0].content));
  const text = calls === 1 ? "not json at all" : JSON.stringify(COMPLIANT);
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: text } }],
      usage: { prompt_tokens: 900, completion_tokens: 400 },
    }),
  };
};
const fourth = await generateDna("ember glow");
assert.equal(calls, 2, `non-JSON output retries exactly once (got ${calls})`);
assert.deepEqual(fourth.output.palette, COMPLIANT.palette);

// 5. Prompt edit: same DNA-only single-call shape.
calls = 0;
(globalThis as Record<string, unknown>).fetch = async () => {
  calls++;
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify({ delta: { axes: { warmth: 0.8 } } }) } }],
      usage: { prompt_tokens: 900, completion_tokens: 400 },
    }),
  };
};
const edit = await generateDnaDelta({ axes: AXES, palette: COMPLIANT.palette }, "warmer");
assert.equal(calls, 1, "prompt edit costs exactly one call");
assert.deepEqual(edit.delta, { axes: { warmth: 0.8 } });

// 6. DNA v2 strictness: plan/profile/selfCheck in the reply fail validation.
calls = 0;
(globalThis as Record<string, unknown>).fetch = async () => {
  calls++;
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify({ ...COMPLIANT, plan: { colors: [] }, profile: "standard" }) } }],
      usage: { prompt_tokens: 900, completion_tokens: 400 },
    }),
  };
};
let threw = null;
try {
  await generateDna("ember glow");
} catch (err) {
  threw = err;
}
assert.ok(threw instanceof Error, "plan/profile in the reply must fail validation");
assert.equal(calls, 2, "invalid reply retries exactly once, then fails");

console.log("SINGLE_CALL: all 6 pass (1-call compliant, byte-stable prompt, 1-retry, non-JSON retry, 1-call edit, strict DNA-only)");
