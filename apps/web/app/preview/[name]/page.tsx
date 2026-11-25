import Link from "next/link";
import { notFound } from "next/navigation";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { componentTokenVars, getManifests, getCatalogManifests } from "@arche-ui/registry-core";
import { SiteNav } from "@/components/site-nav";
import { PageContainer } from "@/components/page-container";
import { IdentityFontLinks } from "@/components/identity-fonts";
import { ComponentDetail } from "@/components/catalog-reference";
import { PreviewShell } from "@/components/preview-shell";
import { ArrowLeft } from "lucide-react";

const FIXTURE_FILES: Record<string, { file: string; label: string }> = {
  default: { file: "identity.default.json", label: "Arche Default" },
};

function loadFixture(file: string): {
  fonts: { sans: string; display: string; mono: string };
  tokens: Record<string, Record<string, { $value: unknown }>>;
  components: Record<string, Record<string, unknown>>;
} {
  // Fixtures live at the repo root; the dev server cwd is apps/web.
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

export function generateStaticParams() {
  return getCatalogManifests().map((manifest) => ({ name: manifest.name }));
}

/**
 * Preview route (Part 7): any catalog component or block, live, under any
 * fixture identity in either mode — with a floating edit/swap bar and an
 * in-preview remix drawer.
 */
export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ identity?: string; mode?: string }>;
}) {
  const { name } = await params;
  const query = await searchParams;
  const manifest = getCatalogManifests().find((m) => m.name === name);
  if (!manifest) {
    notFound();
  }
  const key = query.identity && query.identity in FIXTURE_FILES ? query.identity : "default";
  const mode = query.mode === "dark" ? "dark" : "light";
  const payload = loadFixture(FIXTURE_FILES[key]!.file);

  const vars: Record<string, string> = {};
  for (const [token, entry] of Object.entries(payload.tokens[mode] ?? {})) {
    if (typeof entry.$value === "string") {
      vars[token] = entry.$value;
    }
  }
  Object.assign(vars, componentTokenVars(getManifests(), payload.components));
  const category = (manifest as { category?: string }).category;
  const isBlock = category === "marketing" || category === "application";
  const blockBackground =
    isBlock && typeof (payload.components[manifest.name] as Record<string, unknown> | undefined)?.background === "string"
      ? (payload.components[manifest.name] as Record<string, unknown>).background as string
      : undefined;

  return (
    <>
      <IdentityFontLinks fonts={payload.fonts} />
      <SiteNav />
      <PageContainer width="wide" className="py-12 pb-28">
        <Link href="/components" className="text-sm text-muted-foreground underline">
          <ArrowLeft size={14} aria-hidden="true" style={{ verticalAlign: "-0.2em" }} /> Catalog
        </Link>
        <h1 className="font-display mt-2 text-4xl">{manifest.title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Full-app preview: the enterprise demo under the {FIXTURE_FILES[key]!.label} fixture identity ({mode} mode), with every catalog entry in situ. Swap identity or mode
          from the floating bar — Edit opens the remix drawer.
        </p>
        <div className="mt-6">
          <PreviewShell
            name={manifest.name}
            isBlock={isBlock}
            vars={vars}
            mode={mode}
            identity={key}
            identities={Object.entries(FIXTURE_FILES).map(([id, f]) => ({ id, label: f.label }))}
            blockBackground={blockBackground}
          />
        </div>
        <div className="mx-auto mt-8 max-w-3xl">
          <ComponentDetail manifest={manifest} />
        </div>
      </PageContainer>
    </>
  );
}
