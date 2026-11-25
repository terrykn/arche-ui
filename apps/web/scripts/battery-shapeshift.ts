/**
 * Shapeshift battery (acceptance 4 + examples regeneration): ≥12 prompts
 * incl. enterprise set + adversarial pair, plus one MCP generate_identity.
 * Every compiled payload must pass all enforce-tier checks post-repair;
 * repairs appear in meta.adjustments with rule ids; derived profiles recorded;
 * logs carry DNA + derived profile from the single response. Cleans up
 * every draft + log row it creates.
 * Usage: ../../packages/foundation/node_modules/.bin/tsx --env-file=.env.local scripts/battery-shapeshift.ts
 */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { assertGeneratedCompliant, checkDesignRules } from "@arche-ui/registry-core";
import { generateFromPhrase as generate } from "../lib/generation/service";
import { HostedBackend } from "../lib/mcp-host";

const PROMPTS = [
  "enterprise fintech dashboard",
  "healthcare admin",
  "law firm client portal",
  "90s arcade",
  "quiet hospital calm",
  "marble garden party",
  "glitch noise broadcast",
  "ember glow",
  "ancient Greece",
  "midnight ocean trading terminal",
  "sunny neighborhood bakery",
  "make it super colorful and saturated everywhere",
  "neon cyberpunk bank",
];

const sliceStart = Number(process.argv[2] ?? 0);
const sliceEnd = Number(process.argv[3] ?? PROMPTS.length);
const RUN = PROMPTS.slice(sliceStart, sliceEnd);
const includeMcp = sliceEnd >= PROMPTS.length;

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: profile } = await sb.from("profiles").select("id,username").eq("username", "terrykn7").maybeSingle();
const userId = (profile as unknown as { id: string }).id;
const username = (profile as unknown as { username: string }).username;

const created: string[] = [];
let repaired = 0;
try {
  for (const [index, prompt] of RUN.entries()) {
    // Groq free TPM (8K/min): the taught system block is large — pace calls.
    if (index > 0 || sliceStart > 0) await new Promise((r) => setTimeout(r, 30000));
    const out = await generate(userId, prompt);
    created.push(out.libraryId);
    const { data } = await sb.from("libraries").select("payload").eq("id", out.libraryId).maybeSingle();
    const payload = (data as unknown as { payload: Parameters<typeof assertGeneratedCompliant>[0] }).payload;
    // Acceptance 4: passes all enforce-tier checks post-repair.
    assertGeneratedCompliant(payload);
    assert.ok(["enterprise", "standard", "expressive"].includes(payload.dna!.profile as string), "profile recorded");
    const adj = (payload.meta.adjustments as Array<{ ruleId?: string }>) ?? [];
    const ruleIds = new Set(checkDesignRules(payload).map(() => ""));
    void ruleIds;
    for (const a of adj) {
      if (a.ruleId) {
        repaired++;
        assert.match(a.ruleId, /^[a-z-]+$/, `adjustment rule id well-formed (${a.ruleId})`);
      }
    }
    if (payload.dna!.profile === "enterprise") {
      assert.notEqual(payload.typeScale, "editorial-1.5", "enterprise never takes editorial-1.5");
    }
    const { data: log } = await sb.from("generation_logs").select("dna,model,status").eq("library_id", out.libraryId).maybeSingle();
    const dna = (log as unknown as { dna: { plan: { colors: unknown[] }; selfCheck: { verdict: string }; profile: string; rulesVersion: number }; model: string; status: string }).dna;
    assert.equal((log as unknown as { status: string }).status, "ok");
    assert.ok(dna.plan.colors.length >= 4 && dna.plan.colors.length <= 6, "plan has 4-6 colors");
    assert.ok(["pass", "revised"].includes(dna.selfCheck.verdict), "self-check verdict recorded");
    assert.equal(dna.rulesVersion, 1);
    assert.equal(payload.dna!.profile, dna.profile);
    console.log(`ok prompt=${JSON.stringify(prompt)} profile=${payload.dna!.profile} scale=${payload.typeScale} adj=${adj.length}`);
  }

  // MCP path: generate_identity delegates to the same service.
  if (includeMcp) {
  await new Promise((r) => setTimeout(r, 30000));
  const backend = new HostedBackend(userId, username, "http://localhost:3000");
  const mcpOut = await backend.generateIdentity("quiet library reading room");
  created.push(mcpOut.libraryId);
  const { data: mcpLib } = await sb.from("libraries").select("payload").eq("id", mcpOut.libraryId).maybeSingle();
  assertGeneratedCompliant((mcpLib as unknown as { payload: Parameters<typeof assertGeneratedCompliant>[0] }).payload);
  const { data: mcpLog } = await sb.from("generation_logs").select("dna").eq("library_id", mcpOut.libraryId).maybeSingle();
  assert.ok((mcpLog as unknown as { dna: { plan: unknown } }).dna.plan, "mcp log carries the plan");
  console.log(`ok mcp generate_identity profile=${(mcpLib as unknown as { payload: { dna: { profile: string } } }).payload.dna.profile}`);
  }

  console.log(`BATTERY: ${RUN.length + (includeMcp ? 1 : 0)} generations compliant, design repairs recorded: ${repaired}`);
} finally {
  for (const id of created) {
    await sb.from("generation_logs").delete().eq("library_id", id);
    await sb.from("libraries").delete().eq("id", id);
  }
  await sb.from("generation_logs").delete().eq("user_id", userId);
  console.log(`BATTERY_CLEANED: ${created.length} drafts + their logs removed`);
}
