#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { LocalBackend } from "./local.js";
import { createMcpServer } from "./server.js";

async function main(): Promise<number> {
  const backend = new LocalBackend();
  const configured = (await backend.listLibraries()).length;
  if (configured === 0) {
    // Catalog tools only: say so on stderr (stdout is the MCP channel).
    console.error("arche-mcp: no payloads configured (set ARCHE_MCP_PAYLOADS=<file-or-dir>); catalog tools only.");
  }
  const server = createMcpServer(backend);
  await server.connect(new StdioServerTransport());
  return 0;
}

main().catch((error) => {
  console.error(`arche-mcp: ${(error as Error).message}`);
  process.exit(1);
});
