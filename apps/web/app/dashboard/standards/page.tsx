import { getManifests } from "@arche/registry-core";
import { PageContainer } from "@/components/page-container";

export default function DashboardStandards() {
  const manifests = getManifests();
  return (
    <PageContainer width="wide" className="py-8 sm:py-10">
      <h1 className="font-display text-3xl">Standards</h1>
      <p className="mt-2 text-muted-foreground">
        The usage laws from the manifests — purpose, fit, and checkable rules per component.
      </p>
      <div className="mt-6 flex flex-col gap-4">
        {manifests.map((manifest) => (
          <section key={manifest.name} className="rounded-lg border-(length:--border-width) border-border p-4">
            <h2 className="font-medium">{manifest.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{manifest.standards.purpose}</p>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {manifest.standards.rules.map((rule) => (
                <li key={rule.id}>
                  <code>{rule.id}</code> [{rule.severity}]: {rule.check}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
