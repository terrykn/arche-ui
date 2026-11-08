import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { saveSettings } from "./actions";
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
    .select("username,display_name,theme,registry_token_hash,registry_token_prefix")
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
    theme: string;
    registry_token_hash: string | null;
    registry_token_prefix: string | null;
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-3xl">Settings</h1>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {saved ? <p className="mt-3 text-sm text-muted-foreground">Saved.</p> : null}
      <form action={saveSettings} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Username (used in /r/&lt;username&gt; and /p/&lt;username&gt; routes)
          <input
            name="username"
            defaultValue={row.username}
            className="rounded-md border-(length:--border-width) border-input bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Theme
          <select
            name="theme"
            defaultValue={row.theme}
            className="rounded-md border-(length:--border-width) border-input bg-background px-3 py-2"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <button type="submit" className="w-fit rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          Save
        </button>
      </form>
      <section className="mt-8">
        <h2 className="text-lg font-medium">Registry token</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bearer token for installing your private libraries. Stored hashed; revocable. `arche login` stores this token on your machine; revoking it signs the CLI out everywhere.
        </p>
        <TokenManager hasToken={!!row.registry_token_hash} prefix={row.registry_token_prefix} />
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-medium">MCP tokens</h2>
        <McpTokenManager tokens={mcpTokens} />
      </section>
    </main>
  );
}
