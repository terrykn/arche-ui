import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { SiteNav } from "@/components/site-nav";
import { CatalogShowcase } from "@/components/catalog-showcase";
import { InstallBlock } from "@/components/install-block";

/** Public identity page — full catalog rendered live in the identity's tokens. */
export default async function PublicIdentityPage({
  params,
}: {
  params: Promise<{ user: string; identity: string }>;
}) {
  const { user: username, identity: slug } = await params;
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
      tokens: Record<string, Record<string, { $value: unknown }>>;
      components: Record<string, Record<string, unknown>>;
    };
  };
  if (row.visibility === "private") {
    notFound();
  }
  const { data: versions } = await service
    .from("library_versions")
    .select("version,published_at")
    .eq("library_id", row.id)
    .order("version", { ascending: false });
  const versionList = (versions ?? []) as unknown as Array<{ version: number; published_at: string }>;
  if (versionList.length === 0) {
    notFound();
  }

  const vars: Record<string, string> = {};
  for (const [name, token] of Object.entries(row.payload.tokens.light ?? {})) {
    if (typeof token.$value === "string") {
      vars[name] = token.$value;
    }
  }
  const knobCount = Object.values(row.payload.components).reduce(
    (sum, selections) => sum + Object.keys(selections).length,
    0,
  );

  const host = (await headers()).get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const base = `${proto}://${host}/r/${username}/${slug}`;

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm text-muted-foreground">by {username}</p>
        <h1 className="font-display text-4xl">{row.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {Object.keys(row.payload.tokens.light ?? {}).length} tokens · {knobCount} knob selections ·{" "}
          {versionList.length} version{versionList.length === 1 ? "" : "s"} (latest v
          {versionList[0]!.version})
        </p>

        <section className="mt-8">
          <h2 className="text-lg font-medium">Install</h2>
          <InstallBlock base={base} username={username} slug={slug} authed={false} />
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-medium">Catalog</h2>
          <div className="mt-2 rounded-xl border border-border p-4">
            <CatalogShowcase vars={vars} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-medium">Versions</h2>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {versionList.map((v) => (
              <li key={v.version} className="rounded-md border border-border p-3">
                v{v.version} · {new Date(v.published_at).toLocaleString()} · pinned:{" "}
                <code>{base}/v/{v.version}/all.json</code>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
