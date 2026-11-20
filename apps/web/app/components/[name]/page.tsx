import Link from "next/link";
import { notFound } from "next/navigation";
import { getManifests, getTokenContract } from "@arche/registry-core";
import { SiteNav } from "@/components/site-nav";
import { PageContainer } from "@/components/page-container";
import { ComponentDetail } from "@/components/catalog-reference";
import { ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  return getManifests().map((manifest) => ({ name: manifest.name }));
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const manifest = getManifests().find((m) => m.name === name);
  if (!manifest) {
    notFound();
  }
  const contract = getTokenContract() as { contractVersion: number };

  return (
    <>
      <SiteNav />
      <PageContainer width="prose" className="py-12">
        <Link href="/components" className="text-sm text-muted-foreground underline">
          <ArrowLeft size={14} aria-hidden="true" style={{ verticalAlign: "-0.2em" }} /> Components
        </Link>
        <div className="mt-2">
          <ComponentDetail manifest={manifest} />
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Rendered from manifest v{manifest.manifestVersion}, token contract v{contract.contractVersion}.
        </p>
      </PageContainer>
    </>
  );
}
