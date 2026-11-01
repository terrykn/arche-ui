import { redirect } from "next/navigation";
import { getManifests, getTokenContract } from "@arche/registry-core";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { IdentityEditor } from "./editor";

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
    .select("id,name,payload")
    .eq("id", id)
    .eq("owner", user.id)
    .maybeSingle();
  if (!library) {
    redirect("/dashboard/identities");
  }
  const row = library as unknown as { name: string; payload: unknown };

  return (
    <IdentityEditor
      libraryId={id}
      libraryName={row.name}
      initialPayload={row.payload as never}
      manifests={getManifests() as never}
      contract={getTokenContract() as never}
    />
  );
}
