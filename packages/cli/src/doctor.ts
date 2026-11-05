import { existsSync, readFileSync } from "node:fs";
import { fetchRegistryItem, verifyToken } from "./api.js";
import { TOKEN_PLACEHOLDER, parseArcheRegistryUrl, shadcnAvailable, wiredArcheNamespaces } from "./engine.js";
import { configPath, loadConfig } from "./config.js";

interface DoctorLine {
  ok: boolean;
  label: string;
  detail: string;
}

/** Validate the setup and report each line pass/fail. Fixes nothing. */
export async function commandDoctor(): Promise<number> {
  const lines: DoctorLine[] = [];
  const cwd = process.cwd();
  const config = loadConfig();

  if (!config) {
    lines.push({
      ok: false,
      label: "login",
      detail: `no stored login (config file: ${configPath()}) — run \`arche login\`.`,
    });
  } else {
    const verified = await verifyToken(config.appUrl, config.token);
    if (verified.ok) {
      lines.push({ ok: true, label: "login", detail: `signed in as ${verified.username} (${config.appUrl}).` });
    } else if (verified.kind === "unauthorized") {
      lines.push({
        ok: false,
        label: "login",
        detail: `stored token for ${config.username} was rejected (revoked?) — run \`arche login\`.`,
      });
    } else {
      lines.push({ ok: false, label: "login", detail: `${verified.message} — check the app origin, then \`arche login\`.` });
    }
  }

  const namespaces = wiredArcheNamespaces(cwd);
  if (namespaces.length === 0) {
    lines.push({
      ok: false,
      label: "components.json",
      detail: "no Arche namespace is wired — run `arche init <user>/<library>`.",
    });
  } else {
    let rawComponents = "";
    try {
      rawComponents = readFileSync(`${cwd}/components.json`, "utf8");
    } catch {
      rawComponents = "";
    }
    if (/arche_[A-Za-z0-9_-]{10,}/.test(rawComponents)) {
      lines.push({
        ok: false,
        label: "components.json",
        detail:
          "a real registry token value is pasted in components.json — revoke it in dashboard settings, then re-run `arche init` so only the placeholder remains.",
      });
    } else {
      const withPlaceholder = namespaces.filter((namespace) => {
        try {
          const parsed = JSON.parse(rawComponents) as {
            registries?: Record<string, unknown>;
          };
          const entry = parsed.registries?.[namespace.key];
          return JSON.stringify(entry).includes(TOKEN_PLACEHOLDER);
        } catch {
          return false;
        }
      });
      lines.push({
        ok: true,
        label: "components.json",
        detail: `${namespaces.length} Arche namespace(s) wired (${namespaces.map((n) => n.key).join(", ")}); ` +
          `${withPlaceholder.length} use(s) the ${TOKEN_PLACEHOLDER} placeholder.`,
      });
    }
  }

  for (const namespace of namespaces) {
    const parsed = parseArcheRegistryUrl(namespace.url);
    if (!parsed) {
      continue;
    }
    const fetched = await fetchRegistryItem(
      `${parsed.appUrl}/r/${parsed.user}/${parsed.library}/all.json`,
      loadConfig()?.token ?? null,
    );
    if (fetched.ok) {
      lines.push({ ok: true, label: `registry ${namespace.key}`, detail: "all.json is reachable." });
    } else if (fetched.kind === "unauthorized") {
      lines.push({
        ok: false,
        label: `registry ${namespace.key}`,
        detail: `all.json returned 404 (wrong name, unpublished, or private without access) — check the name or run \`arche login\`.`,
      });
    } else {
      lines.push({ ok: false, label: `registry ${namespace.key}`, detail: `${fetched.message}.` });
    }
  }

  if (await shadcnAvailable()) {
    lines.push({ ok: true, label: "shadcn", detail: "the shadcn CLI is invocable." });
  } else {
    lines.push({
      ok: false,
      label: "shadcn",
      detail: "the shadcn CLI could not be invoked — install Node 18+ and retry (npx shadcn@latest --version).",
    });
  }

  let failed = 0;
  for (const line of lines) {
    console.log(`${line.ok ? "pass" : "fail"}  ${line.label} — ${line.detail}`);
    if (!line.ok) {
      failed += 1;
    }
  }
  return failed === 0 ? 0 : 1;
}
