import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function IdentitiesPage() {
  const supabase = await createClient();
  const { data: libraries } = await supabase
    .from("libraries")
    .select("id,name,slug,visibility,updated_at")
    .order("updated_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Identities</h1>
        <Link
          href="/dashboard/identities/new"
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
        >
          + New Identity
        </Link>
      </div>
      {!libraries || libraries.length === 0 ? (
        <p className="mt-6 text-muted-foreground">No identities yet.</p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {libraries.map((library) => (
            <li key={library.id} className="rounded-lg border border-border bg-card p-4 text-card-foreground">
              <Link href={`/dashboard/identities/${library.id}`} className="font-medium underline-offset-4 hover:underline">
                {library.name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {library.visibility} · updated {new Date(library.updated_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
