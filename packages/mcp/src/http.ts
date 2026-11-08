import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { McpBackend } from "./backend.js";
import { createMcpServer } from "./server.js";

/**
 * Serves one Streamable HTTP request (stateless, JSON responses) with the
 * shared tool registry. Hosted routes pass their per-caller backend in.
 */
export async function handleMcpHttp(backend: McpBackend, request: Request): Promise<Response> {
  const server = createMcpServer(backend);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    if (request.method === "POST") {
      const parsedBody = await request.json().catch(() => undefined);
      return await transport.handleRequest(request, { parsedBody });
    }
    return await transport.handleRequest(request);
  } finally {
    await transport.close().catch(() => {});
    await server.close().catch(() => {});
  }
}
