import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getBlockManifests, getManifests, getTokenContract } from "@arche/registry-core";
import { FONT_REGISTRY_DATA } from "@arche/foundation/font-data";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { IdentityEditor } from "./editor";
import { EditorTopBar } from "./top-bar";

export default async function EditIdentity({
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
    .select("id,name,slug,visibility,payload")
    .eq("id", id)
    .eq("owner", user.id)
    .maybeSingle();
  if (!library) {
    redirect("/dashboard");
  }
  const row = library as unknown as {
    name: string;
    slug: string;
    visibility: "public" | "private";
    payload: unknown;
  };
  const { data: profile } = await service
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();
  const username = (profile as unknown as { username: string } | null)?.username ?? "user";
  const host = (await headers()).get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";

  return (
    // The editor fills whatever height is left under the top bar instead of
    // assuming it — the bar can wrap on narrow screens.
    <div className="flex h-dvh min-h-0 flex-col">
      <EditorTopBar libraryId={id} initialName={row.name} />
      <IdentityEditor
      libraryId={id}
      libraryName={row.name}
      initialPayload={row.payload as never}
      manifests={getManifests() as never}
      blocks={getBlockManifests() as never}
      contract={getTokenContract() as never}
      install={{
        base: `${proto}://${host}/r/${username}/${row.slug}`,
        username,
        slug: row.slug,
        authed: row.visibility === "private",
      }}
      fonts={FONT_REGISTRY_DATA.fonts.map((f) => ({
        id: f.id,
        family: f.family,
        roles: f.roles,
        slots: f.slots,
        displayOnly: f.displayOnly,
        classification: f.classification,
      }))}
      />
    </div>
  );
}
