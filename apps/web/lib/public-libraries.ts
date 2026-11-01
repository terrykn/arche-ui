import { createServiceClient } from "./supabase/service";

/** Public libraries for the gallery (private libraries are never listed). */
export async function getPublicLibraries() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("libraries")
    .select("id,name,slug,visibility,owner,updated_at,profiles!inner(username)")
    .eq("visibility", "public")
    .order("updated_at", { ascending: false })
    .limit(24);
  return (data ?? []) as unknown as Array<{
    id: string;
    name: string;
    slug: string;
    updated_at: string;
    profiles: { username: string };
  }>;
}
