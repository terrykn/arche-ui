import { DocsBaseProvider } from "@/components/docs-base";
import { DocsNav } from "@/components/docs-nav";

// Dashboard docs render the exact same content components as the public
// /docs pages (single editable source under app/docs). The base provider
// keeps all in-docs links inside /dashboard/docs.
export default function DashboardDocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocsBaseProvider base="/dashboard/docs">
      <div className="dash-docs mx-auto max-w-6xl px-4 pb-10 pt-4 sm:px-6">
        <div className="proto-docs">
          <DocsNav />
          <div className="proto-docs-main">{children}</div>
        </div>
      </div>
    </DocsBaseProvider>
  );
}
