"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user.id;
}

export async function createApplication(formData: FormData) {
  const owner = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/dashboard/applications?error=Name%20is%20required");
  }
  const service = createServiceClient();
  await service.from("applications").insert({ owner, name });
  revalidatePath("/dashboard/applications");
}

export async function renameApplication(formData: FormData) {
  const owner = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) {
    return;
  }
  const service = createServiceClient();
  await service.from("applications").update({ name }).eq("id", id).eq("owner", owner);
  revalidatePath("/dashboard/applications");
}

export async function assignApplication(formData: FormData) {
  const owner = await requireUserId();
  const libraryId = String(formData.get("libraryId") ?? "");
  const applicationId = String(formData.get("applicationId") ?? "") || null;
  if (!libraryId) {
    return;
  }
  const service = createServiceClient();
  const { data: library } = await service
    .from("libraries")
    .select("id")
    .eq("id", libraryId)
    .eq("owner", owner)
    .maybeSingle();
  if (!library) {
    return;
  }
  if (applicationId) {
    const { data: app } = await service
      .from("applications")
      .select("id")
      .eq("id", applicationId)
      .eq("owner", owner)
      .maybeSingle();
    if (!app) {
      return;
    }
  }
  await service.from("libraries").update({ application_id: applicationId }).eq("id", libraryId);
  revalidatePath("/dashboard");
}
