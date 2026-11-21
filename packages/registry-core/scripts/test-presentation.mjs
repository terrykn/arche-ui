/**
 * Unit tests for buildPresentation (Part 5.2 acceptance 18).
 * The builder is a synchronous pure function of the payload: calling it
 * directly with fixtures performs zero model calls by construction (no
 * async work, no network, no generation service import).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPresentation } from "../dist/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(root, "..", "..");
const readFixture = (file) => JSON.parse(readFileSync(join(repoRoot, "fixtures", file), "utf8"));

test("presentation is deterministic and synchronous (zero model calls)", () => {
  const payload = readFixture("identity.default.json");
  const a = buildPresentation(payload, {
    assetBaseUrl: "https://x.supabase.co/storage/v1/object/public/identity-assets",
    libraryId: "lib-1",
    version: 2,
  });
  const b = buildPresentation(payload, {
    assetBaseUrl: "https://x.supabase.co/storage/v1/object/public/identity-assets",
    libraryId: "lib-1",
    version: 2,
  });
  assert.deepEqual(a, b);
  assert.equal(typeof a.imagery, "string");
  assert.ok(a.imagery.length > 0);
  assert.equal(a.specimens.sinkLight, "https://x.supabase.co/storage/v1/object/public/identity-assets/lib-1/v2/sink-light.png");
  assert.equal(a.specimens.sinkDark, "https://x.supabase.co/storage/v1/object/public/identity-assets/lib-1/v2/sink-dark.png");
  assert.equal(a.specimens.og, "https://x.supabase.co/storage/v1/object/public/identity-assets/lib-1/v2/og.png");
});

test("presentation differs between enterprise and expressive profiles", () => {
  const base = readFixture("identity.default.json");
  const enterprise = { ...base, dna: { ...base.dna, profile: "enterprise" } };
  const expressive = { ...base, dna: { ...base.dna, profile: "expressive" } };
  assert.notDeepEqual(
    buildPresentation(enterprise).antiSlop,
    buildPresentation(expressive).antiSlop,
  );
});

test("hand-authored payload (no DNA) defaults to standard guidance", () => {
  const payload = readFixture("identity.default.json");
  delete payload.dna;
  const p = buildPresentation(payload);
  assert.match(p.note, /standard/);
  assert.ok(p.antiSlop.length > 0);
  assert.equal(p.specimens, null);
});

test("motion durations come from the payload tokens when present", () => {
  const payload = readFixture("identity.default.json");
  const p = buildPresentation(payload);
  const fast = payload.tokens?.light?.["--motion-fast"];
  const inner = fast?.$value ?? fast;
  if (inner && typeof inner.duration === "string") {
    assert.ok(p.motion.durationFast.startsWith(inner.duration));
  } else {
    assert.equal(p.motion.durationFast, null);
  }
});
