import Link from "next/link";
import { getBlockManifests } from "@arche-ui/registry-core";
import { SiteNav } from "@/components/site-nav";
import { PageContainer } from "@/components/page-container";
import { BlockPreview } from "@/components/block-preview";
import { ArrowLeft } from "lucide-react";

export default function BlocksPage() {
  const manifests = getBlockManifests();
  const groups = ["marketing", "application"].map((category) => ({
    category,
    items: manifests.filter((m) => m.category === category),
  }));
  return (
    <>
      <SiteNav />
      <PageContainer width="wide" className="py-12">
        <Link href="/components" className="text-sm text-muted-foreground underline">
          <ArrowLeft size={14} aria-hidden="true" style={{ verticalAlign: "-0.2em" }} /> Components
        </Link>
        <h1 className="font-display mt-2 text-4xl">Blocks</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Complete page sections composed from catalog components, distributed exactly like components —
          per-identity items installed through the same CLI. Live previews below render under the site identity.
        </p>
        {groups.map((group) => (
          <section key={group.category} className="mt-10">
            <h2 className="text-lg font-medium capitalize">{group.category}</h2>
            <ul className="mt-4 flex flex-col gap-8">
              {group.items.map((manifest) => (
                <li key={manifest.name} className="overflow-hidden rounded-xl border border-border">
                  <div className="flex flex-wrap items-baseline gap-2 border-b border-border bg-card px-5 py-3">
                    <Link href={`/blocks/${manifest.name}`} className="font-medium underline">
                      {manifest.title}
                    </Link>
                    <code className="font-mono text-xs text-muted-foreground">arche add {manifest.name}</code>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {(manifest.composition?.childComponents ?? []).map((c) => c.name).join(" · ")}
                    </span>
                  </div>
                  <div className="px-5 py-4">
                    <BlockPreview name={manifest.name} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </PageContainer>
    </>
  );
}
