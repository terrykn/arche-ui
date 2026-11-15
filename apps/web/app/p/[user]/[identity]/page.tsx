import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { deriveTypeScale, TYPE_ROLES } from "@arche/registry-core";
import { SiteNav } from "@/components/site-nav";
import { IdentityFontLinks } from "@/components/identity-fonts";
import { EnterpriseDemo } from "@/components/enterprise-demo";
import { InstallBlock } from "@/components/install-block";
import { VersionSpecimen } from "@/components/version-specimen";
import { versionAssetUrls } from "@/lib/version-assets";
import { summarizeChanges, type PayloadLite } from "@/lib/version-diff";

/** Public identity page — the enterprise demo rendered live in the identity's tokens. */
export default async function PublicIdentityPage({
  params,
  searchParams,
}: {
  params: Promise<{ user: string; identity: string }>;
  searchParams?: Promise<{ mode?: string }>;
}) {
  const { user: username, identity: slug } = await params;
  const dark = (await searchParams)?.mode === "dark";
  const service = createServiceClient();

  const { data: profile } = await service
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (!profile) {
    notFound();
  }
  const ownerId = (profile as unknown as { id: string }).id;
  const { data: library } = await service
    .from("libraries")
    .select("id,name,slug,visibility,payload")
    .eq("owner", ownerId)
    .eq("slug", slug)
    .maybeSingle();
  if (!library) {
    notFound();
  }
  const row = library as unknown as {
    id: string;
    name: string;
    slug: string;
    visibility: "public" | "private";
    payload: {
      fonts: { sans: string; display: string; mono: string };
      tokens: Record<string, Record<string, { $value: unknown }>>;
      components: Record<string, Record<string, unknown>>;
      typeScale?: string;
      dna?: { profile?: string };
    };
  };
  if (row.visibility === "private") {
    notFound();
  }
  const { data: versions } = await service
    .from("library_versions")
    .select("version,published_at,payload")
    .eq("library_id", row.id)
    .order("version", { ascending: false });
  const versionList = (versions ?? []) as unknown as Array<{
    version: number;
    published_at: string;
    payload: PayloadLite | null;
  }>;
  // Oldest-first for change summaries: each version narrates prev → next.
  const chronological = [...versionList].reverse();
  const summaries = new Map<number, string[]>();
  chronological.forEach((v, i) => {
    summaries.set(
      v.version,
      summarizeChanges(i === 0 ? null : (chronological[i - 1]!.payload ?? {}), v.payload ?? {}),
    );
  });
  const latestAssets = versionAssetUrls(row.id, versionList[0]?.version ?? 0);
  if (versionList.length === 0) {
    notFound();
  }

  // ?mode=dark renders the sink + strip from the dark token set (same render
  // path, used by publish-time specimen captures). Defaults to light.
  const modeTokens = dark ? (row.payload.tokens.dark ?? row.payload.tokens.light) : row.payload.tokens.light;
  const vars: Record<string, string> = {};
  for (const [name, token] of Object.entries(modeTokens ?? {})) {
    if (typeof token.$value === "string") {
      vars[name] = token.$value;
    }
  }
  const sinkProfile = row.payload.dna?.profile === "enterprise" || row.payload.dna?.profile === "expressive" ? row.payload.dna.profile : "standard";
  const typeSteps = typeof row.payload.typeScale === "string" ? TYPE_ROLES.map((role) => {
    const step = deriveTypeScale(row.payload.typeScale as string, sinkProfile)[role]!;
    return { role, sizePx: step.sizePx, lineHeight: step.lineHeight };
  }) : [];
  const knobCount = Object.values(row.payload.components).reduce(
    (sum, selections) => sum + Object.keys(selections).length,
    0,
  );

  const host = (await headers()).get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const base = `${proto}://${host}/r/${username}/${slug}`;

  return (
    <>
      <IdentityFontLinks fonts={row.payload.fonts} />
      <SiteNav />
      <main className="mx-auto max-w-4xl px-3 py-12">
        <p className="text-sm text-muted-foreground">by {username}</p>
        <h1 className="font-display text-4xl">{row.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {Object.keys(row.payload.tokens.light ?? {}).length} tokens · {knobCount} knob selections ·{" "}
          {versionList.length} version{versionList.length === 1 ? "" : "s"} (latest v
          {versionList[0]!.version})
        </p>

        {latestAssets ? (
          <figure className="mt-8">
            <div className="overflow-hidden rounded-xl border-(length:--border-width) border-border">
              <VersionSpecimen
                src={latestAssets.sinkLight}
                alt={`Demo site rendered under ${row.name}, version ${versionList[0]?.version ?? 1}`}
                className="w-full"
              />
            </div>
            <figcaption className="mt-2 text-sm text-muted-foreground">
              Specimen — v{versionList[0]?.version ?? 1} render, captured at publish time.
            </figcaption>
          </figure>
        ) : null}

        <section className="mt-8">
          <h2 className="text-lg font-medium">Install</h2>
          <InstallBlock base={base} username={username} slug={slug} authed={false} />
        </section>            <section className="mt-8">
          <h2 className="text-lg font-medium">Live site</h2>
          <p className="mt-1 text-sm text-muted-foreground">The Acme Fulfillment demo, live in this identity — every catalog component in situ.</p>
          <div className="mt-2 overflow-hidden rounded-xl border-(length:--border-width) border-border">
            <EnterpriseDemo vars={vars} mode={dark ? "dark" : "light"} typeSteps={typeSteps} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-medium">Version timeline</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every publish is an immutable snapshot with its own specimen renders.
          </p>
          <ol className="mt-2 flex flex-col gap-3">
            {versionList.map((v) => {
              const assets = versionAssetUrls(row.id, v.version);
              return (
                <li key={v.version} className="rounded-md border-(length:--border-width) border-border p-4 text-sm">
                  <p className="font-medium">
                    v{v.version} · {new Date(v.published_at).toLocaleDateString()}
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                    {(summaries.get(v.version) ?? []).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <p className="mt-1 text-muted-foreground">
                    Pinned: <code>{base}/v/{v.version}/all.json</code>
                  </p>
                  {assets ? (
                    <div className="mt-2 overflow-hidden rounded-md border-(length:--border-width) border-border">
                      <VersionSpecimen
                        src={assets.sinkLight}
                        alt={`${row.name} v${v.version} specimen`}
                        className="w-full"
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      </main>
    </>
  );
}
