import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PublishButton } from "./publish-button";
import { InstallBlock } from "@/components/install-block";
import { CopyButton } from "@/components/copy-button";
import { VersionSpecimen } from "@/components/version-specimen";
import { versionAssetUrls } from "@/lib/version-assets";
import { summarizeChanges, type PayloadLite } from "@/lib/version-diff";
import { ArrowLeft } from "lucide-react";

export default async function IdentityDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  const service = createServiceClient();
  const { data: library } = await service
    .from("libraries")
    .select("*")
    .eq("id", id)
    .eq("owner", user.id)
    .maybeSingle();
  if (!library) {
    redirect("/dashboard/identities");
  }
  const row = library as unknown as {
    name: string;
    slug: string;
    visibility: "public" | "private";
  };
  const { data: profile } = await service
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();
  const username = (profile as unknown as { username: string } | null)?.username ?? "user";
  const { data: versions } = await service
    .from("library_versions")
    .select("version,payload_hash,published_at,payload")
    .eq("library_id", id)
    .order("version", { ascending: false });
  const versionList = ((versions ?? []) as unknown as Array<{
    version: number;
    payload_hash: string;
    published_at: string;
    payload: PayloadLite | null;
  }>);
  const chronological = [...versionList].reverse();
  const summaries = new Map<number, string[]>();
  chronological.forEach((v, i) => {
    summaries.set(
      v.version,
      summarizeChanges(i === 0 ? null : (chronological[i - 1]!.payload ?? {}), v.payload ?? {}),
    );
  });
  const latestVersion = versionList[0]?.version ?? 0;
  const latestAssets = versionAssetUrls(id, latestVersion);

  const host = (await headers()).get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const base = `${proto}://${host}/r/${username}/${row.slug}`;
  const authed = row.visibility === "private";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/dashboard/identities" className="text-sm text-muted-foreground underline">
        <ArrowLeft size={14} aria-hidden="true" style={{ verticalAlign: "-0.2em" }} /> Identities
      </Link>
      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{row.name}</h1>
        <Link
          href={`/dashboard/identities/${id}/edit`}
          className="rounded-md border-(length:--border-width) border-border px-3 py-2 text-sm"
        >
          Edit
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {row.visibility} · slug <code>{row.slug}</code>
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Publish</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Validates the payload (tokens, contrast pairs, knobs) and stores an immutable snapshot.
        </p>
        <div className="mt-3">
          <PublishButton libraryId={id} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Install</h2>
        <InstallBlock base={base} username={username} slug={row.slug} authed={authed} />
        {authed ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Private library — installs require your registry token (avatar menu → Settings).
          </p>
        ) : null}
      </section>

      {row.visibility === "public" && latestAssets ? (
        <section className="mt-8">
          <h2 className="text-lg font-medium">Launch kit</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Specimen renders, share image, install command, public page — generated at publish time.
          </p>
          <div className="mt-3 overflow-hidden rounded-md border-(length:--border-width) border-border">
            <VersionSpecimen
              src={latestAssets.og}
              alt={`${row.name} share image, version ${latestVersion}`}
              className="w-full"
            />
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            Public page: <code>/{username}/{row.slug}</code>
            <CopyButton text={`${proto}://${host}/p/${username}/${row.slug}/`} />
          </p>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-lg font-medium">Version timeline</h2>
        {versionList.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Not published yet.</p>
        ) : (
          <ol className="mt-2 flex flex-col gap-3">
            {versionList.map((v) => {
              const assets = versionAssetUrls(id, v.version);
              return (
                <li key={v.version} className="rounded-md border-(length:--border-width) border-border p-4 text-sm">
                  <p className="font-medium">
                    v{v.version} · {new Date(v.published_at).toLocaleString()} · hash{" "}
                    <code>{v.payload_hash.slice(0, 12)}</code>
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
        )}
      </section>
    </main>
  );
}
