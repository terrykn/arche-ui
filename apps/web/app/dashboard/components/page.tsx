import { getManifests } from "@arche/registry-core";
import { ComponentIndex } from "@/components/catalog-reference";

export default function DashboardComponents() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-3xl">Components</h1>
      <p className="mt-2 text-muted-foreground">
        The same manifest-generated reference as the public pages.
      </p>
      <div className="mt-6">
        <ComponentIndex manifests={getManifests()} />
      </div>
    </main>
  );
}
