import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreationDock } from "./creation-dock";
import { IdentityCarousel, type IdentityRow } from "./identity-carousel";
import GradientBg from "@/components/gradient-bg";

/**
 * The creation server actions run a model call plus the deterministic
 * compiles, which outlasts a serverless function's default duration.
 */
export const maxDuration = 60;

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

  const rows = (libraries ?? []) as unknown as IdentityRow[];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-10">
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
            <IdentityCarousel libraries={rows} />
          </>
        )}
      </div>

      {error ? (
        <p role="alert" className="mx-auto mt-8 w-full max-w-xl rounded-md border-(length:--border-width) border-destructive/40 bg-card p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <CreationDock prefill={prefill} />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[-1] h-64 translate-y-[12%] overflow-hidden opacity-20 [mask-image:linear-gradient(to_bottom,transparent,black_35%)] md:left-60"
        style={{ filter: "brightness(0.8) saturate(1.3)" }}
      >
        <GradientBg
          className="dashboard-aurora"
          speed={10}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
        {/* Carves the top edge into a smile: the cover hangs lower in the
            middle so the gradient's edges sweep up while the center dips
            down in a rounded valley. Same color as the page, so it blends.
            Overscanned past every edge and heavily blurred (not mask-feathered)
            so no hard line survives where it meets the blurred aurora. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-[-25%] top-[-40px] h-[85%] bg-background blur-2xl [border-radius:0_0_50%_50%/0_0_100%_100%]"
        />
      </div>
    </main>
  );
}
