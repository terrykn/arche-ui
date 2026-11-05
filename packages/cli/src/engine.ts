import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * THE engine seam (Brief #4 Rule 3): every interaction with the shadcn CLI —
 * spawning it, and the components.json namespace shape — lives in this
 * module. The §10.4 engine swap touches only this file. Nothing else in the
 * CLI may contain shadcn-specific strings or assumptions.
 */

export const TOKEN_PLACEHOLDER = "${ARCHE_TOKEN}";

export interface RegistryNamespace {
  key: string;
  url: string;
}

interface ComponentsJson {
  registries?: Record<string, string | { url?: string; headers?: Record<string, string> }>;
  [key: string]: unknown;
}

export function componentsJsonPath(cwd: string): string {
  return join(cwd, "components.json");
}

export function readComponentsJson(cwd: string): ComponentsJson | null {
  const path = componentsJsonPath(cwd);
  if (!existsSync(path)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as ComponentsJson;
  } catch {
    return null;
  }
}

/** Namespace entry for a library, matching the dashboard's documented scheme. */
export function namespaceEntry(appUrl: string, user: string, library: string): { url: string; headers: Record<string, string> } {
  return {
    url: `${appUrl}/r/${user}/${library}/{name}.json`,
    headers: { Authorization: `Bearer ${TOKEN_PLACEHOLDER}` },
  };
}

function registryUrl(entry: string | { url?: string }): string | null {
  if (typeof entry === "string") {
    return entry;
  }
  return typeof entry.url === "string" ? entry.url : null;
}

/**
 * Parse an Arche registry URL of the form
 * <appUrl>/r/<user>/<library>[/v/<n>]/{name}.json back into its parts.
 * Returns null for foreign (non-Arche) registries.
 */
export function parseArcheRegistryUrl(url: string): { appUrl: string; user: string; library: string } | null {
  const match = url.match(/^(https?:\/\/[^/]+)\/r\/([^/]+)\/([^/{}]+)(?:\/v\/\d+)?\/\{name\}\.json$/);
  if (!match) {
    return null;
  }
  return { appUrl: match[1]!, user: match[2]!, library: match[3]! };
}

/** All Arche namespaces wired in this project's components.json. */
export function wiredArcheNamespaces(cwd: string): RegistryNamespace[] {
  const parsed = readComponentsJson(cwd);
  if (!parsed || typeof parsed.registries !== "object" || parsed.registries === null) {
    return [];
  }
  const namespaces: RegistryNamespace[] = [];
  for (const [key, entry] of Object.entries(parsed.registries)) {
    const url = registryUrl(entry);
    if (url && parseArcheRegistryUrl(url)) {
      namespaces.push({ key, url });
    }
  }
  return namespaces;
}

/**
 * Resolve which wired library a command targets: the only one when exactly
 * one is wired, the --library match when several, else an error naming the fix.
 */
export function resolveTarget(
  cwd: string,
  libraryFlag: string | undefined,
): { ok: true; key: string; user: string; library: string; appUrl: string } | { ok: false; message: string } {
  const namespaces = wiredArcheNamespaces(cwd);
  if (namespaces.length === 0) {
    return { ok: false, message: "no Arche library is wired here — run `arche init <user>/<library>` first." };
  }
  if (!libraryFlag) {
    if (namespaces.length === 1) {
      const parsed = parseArcheRegistryUrl(namespaces[0]!.url)!;
      return { ok: true, key: namespaces[0]!.key, ...parsed };
    }
    const keys = namespaces.map((n) => n.key).join(", ");
    return { ok: false, message: `several Arche libraries are wired (${keys}) — pass --library <user>/<library>.` };
  }
  for (const namespace of namespaces) {
    const parsed = parseArcheRegistryUrl(namespace.url)!;
    if (`${parsed.user}/${parsed.library}` === libraryFlag) {
      return { ok: true, key: namespace.key, ...parsed };
    }
  }
  return { ok: false, message: `library ${libraryFlag} is not wired here — run \`arche init ${libraryFlag}\` first.` };
}

/**
 * Launcher for the shadcn CLI (Rule 6): Windows `.cmd` shims cannot be
 * spawned without a shell (Node returns EINVAL/ENOENT), and shell strings
 * would interpolate user input — so we bypass the shim and spawn npm's
 * real `npx-cli.js` under the current node binary with an argument array.
 * No shell, no string concatenation, on every OS.
 */
function npxLauncher(): { command: string; prefixArgs: string[] } {
  const execDir = dirname(process.execPath);
  const candidates = [
    join(execDir, "node_modules", "npm", "bin", "npx-cli.js"),
    join(execDir, "..", "lib", "node_modules", "npm", "bin", "npx-cli.js"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return { command: process.execPath, prefixArgs: [candidate] };
    }
  }
  // Last resort: a PATH-resolved npx (POSIX exec bit handles this case).
  return { command: "npx", prefixArgs: [] };
}

/**
 * Spawn the shadcn CLI with inherited stdio (Rule 5): the user answers its
 * prompts directly. Resolves with shadcn's exit code.
 */
export function runShadcn(
  args: string[],
  options: { cwd: string; extraEnv?: Record<string, string> },
): Promise<number> {
  const { command, prefixArgs } = npxLauncher();
  return new Promise((resolve) => {
    const child = spawn(command, [...prefixArgs, "--yes", "shadcn@latest", ...args], {
      cwd: options.cwd,
      env: { ...process.env, ...options.extraEnv },
      stdio: "inherit",
      shell: false,
    });
    child.on("error", () => {
      resolve(127);
    });
    child.on("close", (code) => {
      resolve(typeof code === "number" ? code : 1);
    });
  });
}

/** True when the shadcn CLI can be invoked on this machine. */
export function shadcnAvailable(): Promise<boolean> {
  const { command, prefixArgs } = npxLauncher();
  return new Promise((resolve) => {
    const child = spawn(command, [...prefixArgs, "--yes", "shadcn@latest", "--version"], {
      stdio: "ignore",
      shell: false,
    });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}
