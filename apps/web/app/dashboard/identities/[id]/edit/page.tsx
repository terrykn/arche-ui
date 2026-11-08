import { redirect } from "next/navigation";
import { deriveTypeScale, getManifests, getTokenContract, TYPE_ROLES } from "@arche/registry-core";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { IdentityEditor } from "./editor";
import { PromptEdit } from "./prompt-edit";

export default async function EditIdentity({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ generated?: string }>;
}) {
  const { id } = await params;
  const { generated } = await searchParams;
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
  const row = library as unknown as { name: string; payload: { dna?: { profile?: string }; typeScale?: string } };
  const hasDna = row.payload != null && typeof row.payload === "object" && "dna" in row.payload && row.payload.dna != null;
  const sinkProfile = row.payload.dna?.profile === "enterprise" || row.payload.dna?.profile === "expressive" ? row.payload.dna.profile : "standard";
  const typeSteps = typeof row.payload.typeScale === "string" ? TYPE_ROLES.map((role) => {
    const step = deriveTypeScale(row.payload.typeScale as string, sinkProfile)[role]!;
    return { role, sizePx: step.sizePx, lineHeight: step.lineHeight };
  }) : [];

  return (
    <>
      {generated ? (
        <p role="status" className="mx-auto mt-6 max-w-6xl rounded-md border-(length:--border-width) border-border bg-card px-6 py-3 text-sm text-muted-foreground">
          Draft generated — review the DNA-driven tokens below, prompt-edit or hand-tune, then publish when it looks right.
        </p>
      ) : null}
      {hasDna ? (
        <div className="mx-auto mt-6 max-w-6xl px-6">
          <PromptEdit libraryId={id} />
        </div>
      ) : null}
      <IdentityEditor
      libraryId={id}
      libraryName={row.name}
      initialPayload={row.payload as never}
      manifests={getManifests() as never}
      contract={getTokenContract() as never}
      typeSteps={typeSteps}
      />
    </>
  );
}
