import McpDocs from "@/app/docs/mcp/page";
import { PageContainer } from "@/components/page-container";

export default function DashboardMcp() {
  return (
    <PageContainer width="wide" className="py-8 sm:py-10">
      <h1 className="font-display text-3xl">MCP</h1>
      <div className="mt-4">
        <McpDocs />
      </div>
    </PageContainer>
  );
}
