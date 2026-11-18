import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { UsernameForm } from "./username-form";
import { TokenManager } from "./token-manager";
import { McpTokenManager } from "./mcp-token-manager";
import { ensureProfileExists } from "@/lib/profiles";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const service = createServiceClient();
  if (!user) {
    redirect("/sign-in");
  }
  // Self-healing: accounts predating the new-user trigger have no profiles
  // row, which this page reads unconditionally — ensure it before selecting.
  await ensureProfileExists(
    service,
    user.id,
    user.email ?? null,
    ((user.user_metadata?.full_name ?? user.user_metadata?.name ?? null) as string | null),
  );
  const { data: profile } = await service
    .from("profiles")
    .select("username,display_name,registry_token_hash,registry_token_prefix")
    .eq("id", user!.id)
    .single();
  const { data: mcpRows } = await service
    .from("mcp_tokens")
    .select("id,label,created_at,last_used_at")
    .eq("user_id", user!.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  const mcpTokens = ((mcpRows ?? []) as Array<{
    id: string;
    label: string;
    created_at: string;
    last_used_at: string | null;
  }>);
  const row = profile as unknown as {
    username: string;
    display_name: string | null;
    registry_token_hash: string | null;
    registry_token_prefix: string | null;
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="max-w-2xl">
      <h1 className="font-display text-3xl">Settings</h1>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {saved ? <p className="mt-3 text-sm text-muted-foreground">Saved.</p> : null}
      <UsernameForm defaultValue={row.username} />
      <section className="mt-8">
        <h2 className="text-lg font-medium">Registry token</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This bearer token is used for installing your private libraries through the CLI. For more
          information: <Link href="/dashboard/docs/configuration" className="underline">Configuration</Link>.
        </p>
        <TokenManager hasToken={!!row.registry_token_hash} prefix={row.registry_token_prefix} />
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-medium">MCP tokens</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This token lets agents read your libraries and publish changes through the MCP server. For
          more information: <Link href="/dashboard/docs/mcp" className="underline">Model Context Protocol</Link>.
        </p>
        <McpTokenManager tokens={mcpTokens} />
      </section>
      </div>
    </main>
  );
}
