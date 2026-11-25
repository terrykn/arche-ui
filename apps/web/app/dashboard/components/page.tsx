import { getManifests } from "@arche-ui/registry-core";
import { ComponentIndex } from "@/components/catalog-reference";
import { PageContainer } from "@/components/page-container";

export default function DashboardComponents() {
  return (
    <PageContainer width="wide" className="py-8 sm:py-10">
      <h1 className="font-display text-3xl">Components</h1>
      <p className="mt-2 text-muted-foreground">
        The same manifest-generated reference as the public pages.
      </p>
      <div className="mt-6">
        <ComponentIndex manifests={getManifests()} />
      </div>
    </PageContainer>
  );
}
