import { handleMcpHttp } from "@arche/mcp";
import { HostedBackend } from "@/lib/mcp-host";
import { hostedMcpEnabled, verifyMcpToken } from "@/lib/mcp-tokens";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

async function authenticate(request: Request) {
  const header = request.headers.get("authorization");
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  const raw = match?.[1];
  if (!raw) return { error: Response.json({ error: "unauthorized" }, { status: 401 }) as Response };
  const supabase = createServiceClient();
  const { data } = await supabase.from("mcp_tokens").select("id,user_id,token_hash,revoked_at");
  const rows = (data ?? []) as Array<{ id: string; user_id: string; token_hash: string; revoked_at: string | null }>;
  const hit = rows.find((r) => !r.revoked_at && verifyMcpToken(raw, r.token_hash));
  if (!hit) return { error: Response.json({ error: "unauthorized" }, { status: 401 }) as Response };
  if (!hostedMcpEnabled(hit.user_id)) {
    return { error: Response.json({ error: "hosted MCP is not enabled for this account" }, { status: 403 }) as Response };
  }
  const { data: profile } = await supabase.from("profiles").select("id,username").eq("id", hit.user_id).single();
  if (!profile) return { error: Response.json({ error: "unauthorized" }, { status: 401 }) as Response };
  const user = profile as unknown as { id: string; username: string };
  await supabase.from("mcp_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", hit.id);
  return { user };
}

async function handleMcp(request: Request) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;
  const url = new URL(request.url);
  const backend = new HostedBackend(auth.user.id, auth.user.username, url.origin);
  return handleMcpHttp(backend, request);
}

export async function GET(request: Request) {
  return handleMcp(request);
}

export async function POST(request: Request) {
  return handleMcp(request);
}

export async function DELETE(request: Request) {
  return handleMcp(request);
}
