import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ExamplesDemo } from "@/components/examples-demo";

const FIXTURE_FILES: Record<string, { file: string; label: string; prompt: string }> = {
  arche: { file: "identity.arche.json", label: "Arche", prompt: "ancient Greece" },
  arcade: { file: "identity.arcade.json", label: "90s Arcade", prompt: "90s arcade" },
  hospital: { file: "identity.hospital.json", label: "Hospital", prompt: "calm hospital" },
  default: { file: "identity.default.json", label: "Arche Default", prompt: "Arche Default" },
  "border-2px": { file: "identity.border-2px.json", label: "Border 2px", prompt: "2px border-width test" },
};

function loadFixture(file: string) {
  const found = [process.cwd(), join(process.cwd(), "..", "..")];
  for (const base of found) {
    try {
      return JSON.parse(readFileSync(join(base, "fixtures", file), "utf8")) as {
        tokens: Record<string, Record<string, { $value: unknown }>>;
      };
    } catch {
      continue;
    }
  }
  throw new Error(`fixture not found: ${file}`);
}

/**
 * Examples: the reusable enterprise demo rotating through the fixture
 * identities — the same site, re-skinned live. Server loads the fixture
 * token sets; the client rotator swaps them without refetching.
 */
export default function Examples() {
  const identities = Object.entries(FIXTURE_FILES).map(([id, f]) => {
    const payload = loadFixture(f.file);
    const vars: Record<string, string> = {};
    for (const [name, token] of Object.entries(payload.tokens.light ?? {})) {
      if (typeof token.$value === "string") {
        vars[name] = token.$value;
      }
    }
    return { id, name: f.label, prompt: f.prompt, components: 37, vars };
  });
  return <ExamplesDemo identities={identities} />;
}
