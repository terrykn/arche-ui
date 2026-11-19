import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createApplication, renameApplication } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-3xl">Applications</h1>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <form action={createApplication} className="mt-6 flex flex-wrap gap-2">
        <Input
          name="name"
          required
          maxLength={80}
          placeholder="New application"
          aria-label="Application name"
          className="flex-1"
        />
        <Button type="submit">Create</Button>
      </form>
      <ul className="mt-6 flex flex-col gap-4">
        {apps.map((app) => (
          <li key={app.id} className="rounded-lg border-(length:--border-width) border-border bg-card p-4 text-card-foreground">
            <form action={renameApplication} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={app.id} />
              <Input
                name="name"
                defaultValue={app.name}
                aria-label={`Rename ${app.name}`}
                className="flex-1"
              />
              <Button type="submit" variant="outline" size="sm">
                Rename
              </Button>
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
