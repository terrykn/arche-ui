import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchRegistryItem, verifyToken } from "./api.js";
import {
  TOKEN_PLACEHOLDER,
  componentsJsonPath,
  namespaceEntry,
  parseArcheRegistryUrl,
  readComponentsJson,
  resolveTarget,
  runShadcn,
  wiredArcheNamespaces,
} from "./engine.js";
import { clearConfig, loadConfig, normalizeUserLibrary, resolveAppUrl } from "./config.js";

export async function commandWhoami(): Promise<number> {
  const config = loadConfig();
  if (!config) {
    console.log("Not signed in. Run `arche login` to sign in.");
    return 1;
  }
  const verified = await verifyToken(config.appUrl, config.token);
  if (!verified.ok) {
    if (verified.kind === "unauthorized") {
      console.log(
        `Signed out: the stored token for ${config.username} is no longer valid (revoked?). Run \`arche login\` to sign in again.`,
      );
    } else {
      console.log(`Signed out: ${verified.message}.`);
    }
    return 1;
  }
  console.log(`${verified.username} (${config.appUrl})`);
  return 0;
}

export function commandLogout(): number {
  const config = loadConfig();
  const had = clearConfig();
  if (had && config) {
    console.log(
      `Signed out ${config.username} on this machine only. To revoke the token server-side (signing out everywhere), revoke it in dashboard settings.`,
    );
  } else {
    console.log("Not signed in.");
  }
  return 0;
}

function archeBase(appUrl: string, user: string, library: string, version?: number): string {
  const base = `${appUrl}/r/${user}/${library}`;
  return version ? `${base}/v/${version}` : base;
}

/** Fetch all.json for init validation: 404 stays 404, network stays network. */
async function fetchAllJson(
  appUrl: string,
  user: string,
  library: string,
  token: string | null,
): Promise<{ ok: true; json: string } | { ok: false; kind: "not-found" | "network"; message: string }> {
  const result = await fetchRegistryItem(`${archeBase(appUrl, user, library)}/all.json`, token);
  if (!result.ok) {
    if (result.kind === "unauthorized") {
      return { ok: false, kind: "not-found", message: "not-found" };
    }
    return { ok: false, kind: "network", message: result.message };
  }
  return result;
}

export async function commandInit(target: string | undefined, options: { app?: string }): Promise<number> {
  if (!target) {
    console.error("arche init: expected `<user>/<library>`.");
    return 1;
  }
  const parsed = normalizeUserLibrary(target);
  if (!parsed) {
    console.error(`arche init: expected \`<user>/<library>\`, got \`${target}\`.`);
    return 1;
  }
  const cwd = process.cwd();
  if (!existsSync(join(cwd, "package.json"))) {
    console.error("arche init: no package.json here — run inside your project directory.");
    return 1;
  }
  const config = loadConfig();
  const appUrl = config?.appUrl ?? resolveAppUrl(options.app);
  if (!config) {
    console.log("Not signed in — continuing for public libraries. Private libraries need `arche login`.");
  }
  if (!readComponentsJson(cwd)) {
    console.log("No components.json — delegating project setup to the stock shadcn init.");
    const code = await runShadcn(["init"], { cwd });
    if (code !== 0) {
      console.error(`arche init: shadcn init exited ${code}.`);
      return code;
    }
    if (!readComponentsJson(cwd)) {
      console.error("arche init: shadcn init did not write components.json — re-run it manually, then retry `arche init`.");
      return 1;
    }
  }
  const fetched = await fetchAllJson(appUrl, parsed.user, parsed.library, config?.token ?? null);
  if (!fetched.ok) {
    if (fetched.kind === "not-found") {
      console.error(
        `arche init: library \`${parsed.user}/${parsed.library}\` was not found (wrong name, unpublished, or private without access).`,
      );
    } else {
      console.error(`arche init: ${fetched.message}.`);
    }
    return 1;
  }
  // Merge the namespace entry, preserving every pre-existing key.
  const path = componentsJsonPath(cwd);
  const raw = readFileSync(path, "utf8");
  const json = JSON.parse(raw) as Record<string, unknown>;
  const registries = (json.registries && typeof json.registries === "object" ? json.registries : {}) as Record<
    string,
    unknown
  >;
  const wanted = namespaceEntry(appUrl, parsed.user, parsed.library);
  let key = "@arche";
  const existingKey = Object.entries(registries).find(([, entry]) => {
    const url = typeof entry === "string" ? entry : (entry as { url?: unknown }).url;
    if (typeof url !== "string") {
      return false;
    }
    const parts = parseArcheRegistryUrl(url);
    return !!parts && parts.user === parsed.user && parts.library === parsed.library;
  })?.[0];
  if (existingKey) {
    key = existingKey;
  } else if (registries["@arche"] !== undefined) {
    key = `@arche-${parsed.library}`;
  }
  const current = registries[key];
  const currentText = typeof current === "string" ? current : JSON.stringify(current);
  const wantedText = JSON.stringify(wanted);
  if (currentText === wantedText) {
    console.log(`Library \`${parsed.user}/${parsed.library}\` is already wired (namespace ${key}) — no changes.`);
    console.log(`Next: \`arche list\`, \`arche install\`, or \`arche add <component>\`.`);
    return 0;
  }
  registries[key] = wanted;
  json.registries = registries;
  writeFileSync(path, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`Wired library \`${parsed.user}/${parsed.library}\` (namespace ${key}).`);
  console.log(`Registry: ${wanted.url} (auth header uses the ${TOKEN_PLACEHOLDER} placeholder).`);
  console.log(`Next: \`arche list\`, \`arche install\`, or \`arche add <component>\`.`);
  return 0;
}

export async function commandAdd(
  components: string[],
  options: { library?: string; version?: number },
): Promise<number> {
  if (components.length === 0) {
    console.error("arche add: expected at least one component name.");
    return 1;
  }
  const cwd = process.cwd();
  const target = resolveTarget(cwd, options.library);
  if (!target.ok) {
    console.error(`arche add: ${target.message}`);
    return 1;
  }
  const config = loadConfig();
  const base = archeBase(target.appUrl, target.user, target.library, options.version);
  const probe = await fetchRegistryItem(`${base}/all.json`, config?.token ?? null);
  if (!probe.ok && probe.kind === "unauthorized") {
    if (!config) {
      console.error(
        `arche add: library \`${target.user}/${target.library}\` is private or doesn't exist — if it's yours, run \`arche login\`.`,
      );
    } else {
      console.error(
        `arche add: library \`${target.user}/${target.library}\` is private or doesn't exist (token rejected) — run \`arche login\` to refresh access.`,
      );
    }
    return 1;
  }
  if (!probe.ok) {
    console.error(`arche add: ${probe.message}.`);
    return 1;
  }
  let specs: string[];
  if (options.version) {
    // Pinned install: direct versioned item URLs, so the installed bytes
    // are the pinned snapshot's bytes.
    specs = components.map((c) => `${base}/${c}.json`);
  } else {
    specs = components.map((c) => `${target.key}/${c}`);
  }
  const code = await runShadcn(["add", ...specs], {
    cwd,
    extraEnv: config ? { ARCHE_TOKEN: config.token } : undefined,
  });
  if (code !== 0) {
    console.error(`arche: shadcn add exited ${code} (library \`${target.user}/${target.library}\`, namespace ${target.key}).`);
  }
  return code;
}

export async function commandInstall(options: { library?: string }): Promise<number> {
  const cwd = process.cwd();
  const target = resolveTarget(cwd, options.library);
  if (!target.ok) {
    console.error(`arche install: ${target.message}`);
    return 1;
  }
  const config = loadConfig();
  const probe = await fetchRegistryItem(`${archeBase(target.appUrl, target.user, target.library)}/all.json`, config?.token ?? null);
  if (!probe.ok && probe.kind === "unauthorized") {
    if (!config) {
      console.error(
        `arche install: library \`${target.user}/${target.library}\` is private or doesn't exist — if it's yours, run \`arche login\`.`,
      );
    } else {
      console.error(
        `arche install: library \`${target.user}/${target.library}\` is private or doesn't exist (token rejected) — run \`arche login\` to refresh access.`,
      );
    }
    return 1;
  }
  if (!probe.ok) {
    console.error(`arche install: ${probe.message}.`);
    return 1;
  }
  const code = await runShadcn(["add", `${target.key}/all`], {
    cwd,
    extraEnv: config ? { ARCHE_TOKEN: config.token } : undefined,
  });
  if (code !== 0) {
    console.error(`arche: shadcn add exited ${code} (library \`${target.user}/${target.library}\`, namespace ${target.key}).`);
  }
  return code;
}

export async function commandList(options: { library?: string }): Promise<number> {
  const cwd = process.cwd();
  const target = resolveTarget(cwd, options.library);
  if (!target.ok) {
    console.error(`arche list: ${target.message}`);
    return 1;
  }
  const config = loadConfig();
  const fetched = await fetchRegistryItem(
    `${archeBase(target.appUrl, target.user, target.library)}/all.json`,
    config?.token ?? null,
  );
  if (!fetched.ok) {
    if (fetched.kind === "unauthorized") {
      console.error(
        `arche list: library \`${target.user}/${target.library}\` is private or doesn't exist — if it's yours, run \`arche login\`.`,
      );
    } else {
      console.error(`arche list: ${fetched.message}.`);
    }
    return 1;
  }
  let names: string[] = [];
  try {
    const item = JSON.parse(fetched.json) as { registryDependencies?: unknown };
    const deps = Array.isArray(item.registryDependencies) ? item.registryDependencies : [];
    names = deps
      .map((d) => String(d).split("/").pop() ?? String(d))
      .filter((n) => n !== "all" && n !== "theme" && n.length > 0);
  } catch {
    console.error("arche list: the registry answered with invalid JSON.");
    return 1;
  }
  for (const name of names) {
    console.log(name);
  }
  console.log(`\n${names.length} components (theme and all are implicit).`);
  return 0;
}

