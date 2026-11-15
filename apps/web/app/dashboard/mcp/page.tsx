import McpDocs from "@/app/docs/mcp/page";

export default function DashboardMcp() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl">MCP</h1>
      <div className="mt-4">
        <McpDocs />
      </div>
    </main>
  );
}
