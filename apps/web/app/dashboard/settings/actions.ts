"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function saveSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  const username = String(formData.get("username") ?? "").trim();
  if (username && !/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(username)) {
    redirect("/dashboard/settings?error=Invalid%20username");
  }
  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({
      ...(username ? { username } : {}),
    })
    .eq("id", user.id);
  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/dashboard");
  redirect("/dashboard/settings?saved=1");
}
