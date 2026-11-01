import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PublishButton } from "./publish-button";
import { InstallBlock } from "@/components/install-block";

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
    .select("version,payload_hash,published_at")
    .eq("library_id", id)
    .order("version", { ascending: false });

  const host = (await headers()).get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const base = `${proto}://${host}/r/${username}/${row.slug}`;
  const authed = row.visibility === "private";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/dashboard/identities" className="text-sm text-muted-foreground underline">
        ← Identities
      </Link>
      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{row.name}</h1>
        <Link
          href={`/dashboard/identities/${id}/edit`}
          className="rounded-md border border-border px-3 py-2 text-sm"
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

      <section className="mt-8">
        <h2 className="text-lg font-medium">Versions</h2>
        {!versions || versions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Not published yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {(versions as unknown as Array<{ version: number; payload_hash: string; published_at: string }>).map(
              (v) => (
                <li key={v.version} className="rounded-md border border-border p-3 text-sm">
                  v{v.version} · {new Date(v.published_at).toLocaleString()} ·
                  hash <code>{v.payload_hash.slice(0, 12)}</code> ·
                  pinned: <code>{base}/v/{v.version}/all.json</code>
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </main>
  );
}
