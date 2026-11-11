import ComponentDoc, { DOC_IDS } from "@/app/docs/components/[id]/page";

export function generateStaticParams() {
  return DOC_IDS.map((id) => ({ id }));
}

export default async function DashboardComponentDoc({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ComponentDoc params={params} />;
}
