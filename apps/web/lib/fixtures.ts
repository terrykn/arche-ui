import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fixturesDir } from "./starter";

export interface FixtureIdentity {
  key: string;
  prompt: string;
  payload: {
    meta: { name: string; contractVersion: number };
    tokens: Record<string, Record<string, { $type: string; $value: unknown }>>;
    components: Record<string, Record<string, unknown>>;
  };
}

const FIXTURES: Array<{ key: string; prompt: string; file: string }> = [
  { key: "arche", prompt: "ancient Greece", file: "identity.arche.json" },
  { key: "arcade", prompt: "90s arcade", file: "identity.arcade.json" },
  { key: "hospital", prompt: "calm hospital", file: "identity.hospital.json" },
  { key: "default", prompt: "Arche Default", file: "identity.default.json" },
];

function loadFixture(file: string): FixtureIdentity["payload"] {
  const dir = fixturesDir();
  return JSON.parse(readFileSync(join(dir, file), "utf8"));
}

/** Demo fixture identities for the hero rotation and Examples (Brief #3 §8). */
export function getDemoFixtures(): FixtureIdentity[] {
  return FIXTURES.map(({ key, prompt, file }) => ({
    key,
    prompt,
    payload: loadFixture(file),
  }));
}

export function tokenVars(
  payload: FixtureIdentity["payload"],
  mode: "light" | "dark",
): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [name, token] of Object.entries(payload.tokens[mode] ?? {})) {
    if (typeof token.$value === "string") {
      vars[name] = token.$value;
    }
  }
  return vars;
}
