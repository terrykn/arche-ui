import { createClient } from "@/lib/supabase/server";

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: libraries } = await supabase
    .from("libraries")
    .select("id,name,slug,visibility,updated_at")
    .order("updated_at", { ascending: false });

  if (!libraries || libraries.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-3xl">Your identities</h1>
        <p className="mt-3 text-muted-foreground">
          You don&apos;t have any identities yet. Create one to get an
          installable component library.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl">Your identities</h1>
      <ul className="mt-6 grid gap-4">
        {libraries.map((library) => (
          <li key={library.id} className="rounded-lg border border-border bg-card p-4 text-card-foreground">
            <p className="font-medium">{library.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {library.visibility} · updated{" "}
              {new Date(library.updated_at).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
