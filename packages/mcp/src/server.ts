import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpBackend } from "./backend.js";
import { buildToolRegistry } from "./tools.js";

/** Mounts the shared §4 tool registry on a fresh server (per transport/request). */
export function createMcpServer(backend: McpBackend): McpServer {
  const server = new McpServer({ name: "arche", version: "0.1.0" });
  for (const tool of buildToolRegistry()) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema },
      async (args) => tool.handler((args ?? {}) as Record<string, unknown>, backend) as never,
    );
  }
  return server;
}
