import { ProtoAurora, ProtoNav, ProtoFooter } from "@/components/proto-shell";
import { DocsNav } from "@/components/docs-nav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="proto-root">
      <ProtoAurora />
      <ProtoNav />
      <div className="proto-view">
        <div className="proto-wrap proto-docs">
          <DocsNav />
          <div className="proto-docs-main">{children}</div>
        </div>
      </div>
      <ProtoFooter />
    </div>
  );
}
