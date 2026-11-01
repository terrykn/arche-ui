import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createApplication, renameApplication } from "./actions";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const service = createServiceClient();
  const { data: applications } = await service
    .from("applications")
    .select("id,name,created_at")
    .eq("owner", user!.id)
    .order("created_at", { ascending: true });
  const { data: libraries } = await service
    .from("libraries")
    .select("id,name,application_id")
    .eq("owner", user!.id);

  const apps = (applications ?? []) as unknown as Array<{ id: string; name: string }>;
  const libs = (libraries ?? []) as unknown as Array<{ id: string; name: string; application_id: string | null }>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-3xl">Applications</h1>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <form action={createApplication} className="mt-6 flex gap-2">
        <input
          name="name"
          required
          maxLength={80}
          placeholder="New application"
          aria-label="Application name"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          Create
        </button>
      </form>
      <ul className="mt-6 flex flex-col gap-4">
        {apps.map((app) => (
          <li key={app.id} className="rounded-lg border border-border bg-card p-4 text-card-foreground">
            <form action={renameApplication} className="flex items-center gap-2">
              <input type="hidden" name="id" value={app.id} />
              <input
                name="name"
                defaultValue={app.name}
                aria-label={`Rename ${app.name}`}
                className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
              />
              <button type="submit" className="rounded-md border border-border px-3 py-1 text-sm">
                Rename
              </button>
            </form>
            <ul className="mt-2 text-sm text-muted-foreground">
              {libs.filter((l) => l.application_id === app.id).map((l) => (
                <li key={l.id}>· {l.name}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}
