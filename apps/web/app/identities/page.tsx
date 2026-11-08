import Link from "next/link";
import { getDemoFixtures, tokenVars } from "@/lib/fixtures";
import { getPublicLibraries } from "@/lib/public-libraries";
import { SiteNav } from "@/components/site-nav";
import { MiniRender } from "@/components/mini-render";

export default async function IdentitiesPage() {
  const fixtures = getDemoFixtures();
  const published = await getPublicLibraries().catch(() => []);

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-4xl">Identities gallery</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Live mini-renders — real components in each identity&apos;s tokens, never screenshots.
          Private identities are never listed.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {fixtures.map((fixture) => (
            <div key={fixture.key} className="rounded-xl border-(length:--border-width) border-border p-3">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="font-medium">{fixture.payload.meta.name}</h2>
                <span className="text-xs text-muted-foreground">“{fixture.prompt}” · fixture</span>
              </div>
              <MiniRender vars={tokenVars(fixture.payload, "light")} />
            </div>
          ))}
        </div>
        {published.length > 0 ? (
          <>
            <h2 className="font-display mt-12 text-2xl">Published by the community</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {published.map((library) => (
                <div key={library.id} className="rounded-xl border-(length:--border-width) border-border p-4">
                  <Link
                    href={`/p/${library.profiles.username}/${library.slug}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {library.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    by {library.profiles.username}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </main>
    </>
  );
}
