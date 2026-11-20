import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";
import { PageContainer } from "@/components/page-container";
import { DocsNav } from "@/components/docs-nav";
import { DocsBaseProvider } from "@/components/docs-base";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="proto-root">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <DocsBaseProvider base="/docs">
          <PageContainer as="div" width="full" className="proto-docs">
            <DocsNav />
            <div className="proto-docs-main">{children}</div>
          </PageContainer>
        </DocsBaseProvider>
      </div>
      <ProtoFooter />
    </div>
  );
}
