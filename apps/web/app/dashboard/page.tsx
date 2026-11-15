import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreationDock } from "./creation-dock";

type LibraryRow = {
  id: string;
  name: string;
  slug: string;
  visibility: string;
  updated_at: string;
  payload: unknown;
};

/** Small gradient swatch derived from the identity's own light color tokens. */
function paletteGradient(payload: unknown): string {
  const tokens =
    (payload as { tokens?: { light?: Record<string, { $value?: unknown }> } } | null)?.tokens
      ?.light ?? {};
  const preferred = [
    "--primary",
    "--accent",
    "--secondary",
    "--muted",
    "--card",
    "--background",
    "--foreground",
  ];
  const stops: string[] = [];
  for (const key of preferred) {
    const v = tokens[key]?.$value;
    if (typeof v === "string" && v.length > 0 && !v.includes(";") && !stops.includes(v)) {
      stops.push(v);
      if (stops.length === 3) break;
    }
  }
  if (stops.length === 0) return "linear-gradient(135deg, var(--muted), var(--accent))";
  if (stops.length === 1) return `linear-gradient(135deg, ${stops[0]}, var(--muted))`;
  return `linear-gradient(135deg, ${stops.join(", ")})`;
}

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; prompt?: string }>;
}) {
  const { error, prompt } = await searchParams;
  const prefill = (prompt ?? "").slice(0, 120);

  const supabase = await createClient();
  const { data: libraries } = await supabase
    .from("libraries")
    .select("id,name,slug,visibility,updated_at,payload")
    .order("updated_at", { ascending: false });

  const rows = (libraries ?? []) as unknown as LibraryRow[];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-6 py-10">
      <div className="flex-1">
        {rows.length === 0 ? (
          <div className="flex min-h-[40dvh] items-center justify-center">
            <Card className="mx-auto w-full max-w-2xl text-center">
              <CardHeader>
                <CardTitle className="font-display text-3xl">Your identities</CardTitle>
                <CardDescription>
                  You don&apos;t have any identities yet. Create one to get installable components and blocks.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl text-foreground">Your identities</h1>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((library) => (
                <li key={library.id}>
                  <Card className="overflow-hidden pt-0">
                    <div
                      className="relative h-28 border-b border-border"
                      style={{ background: paletteGradient(library.payload) }}
                    >
                      <Badge variant="secondary" className="absolute right-3 top-3">
                        {library.visibility}
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle>
                        <Link
                          href={`/dashboard/identities/${library.id}/edit`}
                          className="underline-offset-4 hover:underline"
                        >
                          {library.name}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        updated {new Date(library.updated_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {error ? (
        <p role="alert" className="mx-auto mt-8 w-full max-w-xl rounded-md border-(length:--border-width) border-destructive/40 bg-card p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <CreationDock prefill={prefill} />
    </main>
  );
}
