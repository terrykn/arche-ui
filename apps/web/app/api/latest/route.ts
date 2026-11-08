import { NextResponse } from "next/server";
import { getPublicLibraries } from "@/lib/public-libraries";
import { createServiceClient } from "@/lib/supabase/service";

/** Latest public identities for the freshness surfaces (landing + Examples). */
export async function GET() {
  const libraries = await getPublicLibraries();
  const supabase = createServiceClient();
  const items = [];
  for (const library of libraries.slice(0, 6)) {
    const { data: latest } = await supabase
      .from("library_versions")
      .select("version,published_at")
      .eq("library_id", library.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const row = latest as unknown as { version: number; published_at: string } | null;
    if (!row) continue;
    const prompt = await specimentPrompt(supabase, library.id);
    items.push({
      id: library.id,
      name: library.name,
      username: library.profiles.username,
      slug: library.slug,
      version: row.version,
      publishedAt: row.published_at,
      prompt,
    });
  }
  return NextResponse.json({ items });
}

async function specimentPrompt(supabase: ReturnType<typeof createServiceClient>, libraryId: string): Promise<string | null> {
  const { data } = await supabase.from("libraries").select("payload").eq("id", libraryId).maybeSingle();
  const row = data as unknown as { payload?: { dna?: { source?: { promptText?: string } } } } | null;
  return row?.payload?.dna?.source?.promptText ?? null;
}
