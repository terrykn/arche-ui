import BlockDoc from "@/app/docs/blocks/[id]/page";
import { getBlockManifests } from "@arche/registry-core";

export function generateStaticParams() {
  return getBlockManifests().map((manifest) => ({ id: manifest.name }));
}

export default async function DashboardBlockDoc({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <BlockDoc params={params} />;
}
