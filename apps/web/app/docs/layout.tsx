import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";
import { DocsNav } from "@/components/docs-nav";
import { DocsBaseProvider } from "@/components/docs-base";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="proto-root">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <DocsBaseProvider base="/docs">
          <div className="proto-wrap proto-docs">
            <DocsNav />
            <div className="proto-docs-main">{children}</div>
          </div>
        </DocsBaseProvider>
      </div>
      <ProtoFooter />
    </div>
  );
}
