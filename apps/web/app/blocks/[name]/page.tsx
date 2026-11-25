import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlockManifests, getTokenContract } from "@arche-ui/registry-core";
import { SiteNav } from "@/components/site-nav";
import { PageContainer } from "@/components/page-container";
import { ComponentDetail } from "@/components/catalog-reference";
import { BlockPreview } from "@/components/block-preview";
import { ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  return getBlockManifests().map((manifest) => ({ name: manifest.name }));
}

export default async function BlockPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const manifest = getBlockManifests().find((m) => m.name === name);
  if (!manifest) {
    notFound();
  }
  const contract = getTokenContract() as { contractVersion: number };
  const composition = manifest.composition;

  return (
    <>
      <SiteNav />
      <PageContainer width="prose" className="py-12">
        <Link href="/blocks" className="text-sm text-muted-foreground underline">
          <ArrowLeft size={14} aria-hidden="true" style={{ verticalAlign: "-0.2em" }} /> Blocks
        </Link>
        <section className="mt-4 overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border bg-card px-5 py-2">
            <p className="font-mono text-xs text-muted-foreground">Live preview · site identity</p>
          </div>
          <div className="px-5 py-4">
            <BlockPreview name={manifest.name} />
          </div>
        </section>
        <div className="mt-8">
          <ComponentDetail manifest={manifest} />
        </div>
        {composition ? (
          <section className="mt-6">
            <h2 className="text-lg font-medium">Composition</h2>
            <div className="mt-2 flex flex-col gap-3 text-sm">
              <div>
                <p className="font-medium">Content slots</p>
                <ul className="mt-1 text-muted-foreground">
                  {composition.contentSlots.map((slot) => (
                    <li key={slot.name}>
                      <code>{slot.name}</code> ({slot.kind}
                      {slot.required ? ", required" : ", optional"}
                      {slot.max ? `, max ${slot.max}` : ""})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">Child components</p>
                <p className="mt-1 text-muted-foreground">
                  {composition.childComponents.map((c) => `${c.name}${c.min ? ` ≥${c.min}` : ""}${c.max ? ` ≤${c.max}` : ""}`).join(" · ")}
                </p>
              </div>
              <p className="text-muted-foreground">
                Heading role: <code>{composition.headingRole}</code>
                {composition.landmark ? (
                  <>
                    {" "}· landmark: <code>{composition.landmark}</code>
                  </>
                ) : null}
              </p>
              <p className="rounded-md border border-border bg-card p-3 font-mono text-[13px] text-muted-foreground">
                arche add {manifest.name}
              </p>
            </div>
          </section>
        ) : null}
        <p className="mt-6 text-xs text-muted-foreground">
          Rendered from manifest v{manifest.manifestVersion}, token contract v{contract.contractVersion}.
        </p>
      </PageContainer>
    </>
  );
}
