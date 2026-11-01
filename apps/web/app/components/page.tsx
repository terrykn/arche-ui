import { getManifests } from "@arche/registry-core";
import { SiteNav } from "@/components/site-nav";
import { ComponentIndex } from "@/components/catalog-reference";

export default function ComponentsPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-4xl">Components</h1>
        <p className="mt-2 text-muted-foreground">
          Generated from the foundation manifests — a manifest change updates these pages with no page edits.
        </p>
        <div className="mt-8">
          <ComponentIndex manifests={getManifests()} />
        </div>
      </main>
    </>
  );
}
