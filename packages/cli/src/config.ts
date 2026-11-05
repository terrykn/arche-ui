import { chmodSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface CliConfig {
  appUrl: string;
  username: string;
  token: string;
}

/** OS-appropriate per-user config location (Brief #4 §5). */
export function configDir(): string {
  if (process.platform === "win32") {
    const base = process.env.APPDATA || join(homedir(), "AppData", "Roaming");
    return join(base, "arche");
  }
  const xdg = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(xdg, "arche");
}

export function configPath(): string {
  return join(configDir(), "config.json");
}

export function loadConfig(): CliConfig | null {
  try {
    const raw = readFileSync(configPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<CliConfig>;
    if (
      typeof parsed.appUrl === "string" &&
      typeof parsed.username === "string" &&
      typeof parsed.token === "string" &&
      parsed.appUrl.length > 0 &&
      parsed.username.length > 0 &&
      parsed.token.length > 0
    ) {
      return { appUrl: parsed.appUrl, username: parsed.username, token: parsed.token };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveConfig(config: CliConfig): void {
  mkdirSync(configDir(), { recursive: true });
  writeFileSync(configPath(), JSON.stringify(config, null, 2) + "\n", "utf8");
  try {
    chmodSync(configPath(), 0o600);
  } catch {
    // Windows ACLs do not use POSIX modes; best effort only.
  }
}

/** Returns true when a config file existed and was removed. */
export function clearConfig(): boolean {
  try {
    if (!existsSync(configPath())) {
      return false;
    }
    unlinkSync(configPath());
    return true;
  } catch {
    return false;
  }
}

/**
 * The app origin every registry URL is built from: explicit flag wins,
 * then ARCHE_APP_URL, then the stored login. Never assumes production —
 * a clean machine defaults to the local dev deployment.
 */
export function resolveAppUrl(explicit?: string): string {
  const raw = (explicit || process.env.ARCHE_APP_URL || loadConfig()?.appUrl || "http://localhost:3000").trim();
  return raw.replace(/\/+$/, "");
}

export function normalizeUserLibrary(value: string): { user: string; library: string } | null {
  const parts = value.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }
  return { user: parts[0]!, library: parts[1]! };
}
