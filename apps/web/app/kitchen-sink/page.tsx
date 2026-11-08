import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { deriveTypeScale, getManifests, TYPE_ROLES } from "@arche/registry-core";
import { KitchenSink } from "@/components/kitchen-sink";
import { SiteNav } from "@/components/site-nav";

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
      return JSON.parse(readFileSync(join(base, "fixtures", file), "utf8"));
    } catch {
      continue;
    }
  }
  throw new Error(`fixture not found: ${file}`);
}

/**
 * Kitchen-sink QA surface (Part 2): the full catalog under any fixture
 * identity, light or dark, via ?identity=&mode=. Used for visual QA and
 * the specimen captures — same page, zero code changes per identity.
 */
export default async function KitchenSinkPage({
  searchParams,
}: {
  searchParams: Promise<{ identity?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const key = params.identity && params.identity in FIXTURE_FILES ? params.identity : "arche";
  const mode = params.mode === "dark" ? "dark" : "light";
  const fixture = FIXTURE_FILES[key]!;
  const payload = loadFixture(fixture.file) as {
    tokens: Record<string, Record<string, { $value: unknown }>>;
    typeScale?: string;
    dna?: { profile?: string };
  };

  const vars: Record<string, string> = {};
  for (const [name, token] of Object.entries(payload.tokens[mode] ?? {})) {
    if (typeof token.$value === "string") {
      vars[name] = token.$value;
    }
  }
  const profile = payload.dna?.profile === "enterprise" || payload.dna?.profile === "expressive" ? payload.dna.profile : "standard";
  const typeSteps = typeof payload.typeScale === "string" ? TYPE_ROLES.map((role) => {
    const step = deriveTypeScale(payload.typeScale as string, profile)[role]!;
    return { role, sizePx: step.sizePx, lineHeight: step.lineHeight };
  }) : [];

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-sm text-muted-foreground">
          <Link href="/" className="underline">Arche</Link> · kitchen sink
        </p>
        <h1 className="font-display text-3xl">Kitchen sink</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {fixture.label} · from “{fixture.prompt}” · {mode} mode. Every catalog component, one page.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span>
            Identity:{" "}
            {Object.entries(FIXTURE_FILES).map(([id, f], i) => (
              <span key={id}>
                {i > 0 ? " · " : ""}
                <Link href={`/kitchen-sink?identity=${id}&mode=${mode}`} className={id === key ? "font-semibold" : "underline"}>
                  {f.label}
                </Link>
              </span>
            ))}
          </span>
          <span>
            Mode:{" "}
            <Link href={`/kitchen-sink?identity=${key}&mode=light`} className={mode === "light" ? "font-semibold" : "underline"}>light</Link>
            {" · "}
            <Link href={`/kitchen-sink?identity=${key}&mode=dark`} className={mode === "dark" ? "font-semibold" : "underline"}>dark</Link>
          </span>
        </div>
        <div className="mt-4 rounded-xl border-(length:--border-width) border-border p-4">
          <KitchenSink manifests={getManifests()} vars={vars} mode={mode} typeSteps={typeSteps} />
        </div>
      </main>
    </>
  );
}
