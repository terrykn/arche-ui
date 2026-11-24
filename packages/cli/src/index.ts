#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCheck } from "./check.js";
import {
  commandAdd,
  commandInit,
  commandInstall,
  commandList,
  commandLogout,
  commandWhoami,
} from "./commands.js";
import { commandDoctor } from "./doctor.js";
import { loginBrowser, loginWithToken, loginWithTokenEnv } from "./login.js";

const HELP = `arche — install and check Arche component libraries

Usage:
  arche login [--app <url>] [--token | --token-env]
  arche logout
  arche whoami
  arche init <user>/<library> [--app <url>]
  arche add <component...> [--library <user>/<library>] [--version <n>]
  arche install [--library <user>/<library>]
  arche list [--library <user>/<library>]
  arche check [--strict]
  arche doctor

Options:
  --app <url>       Arche app origin (or ARCHE_APP_URL). Defaults to the
                    stored login, else the hosted app.
  --token           Paste the registry token (headless login).
  --token-env       Read the registry token from ARCHE_TOKEN (CI).
  --library <u/l>   Target library when several are wired.
  --version <n>     Install from the version-pinned registry route.
  --strict          arche check exits 1 when any finding is printed.
`;

interface ParsedArgs {
  positionals: string[];
  flags: Map<string, string | true>;
}

const VALUE_FLAGS = new Set(["--app", "--library", "--version"]);

function parseArgs(args: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags = new Map<string, string | true>();
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!;
    if (arg.startsWith("--")) {
      if (VALUE_FLAGS.has(arg) && i + 1 < args.length) {
        flags.set(arg, args[i + 1]!);
        i += 1;
      } else {
        flags.set(arg, true);
      }
    } else {
      positionals.push(arg);
    }
  }
  return { positionals, flags };
}

function flagValue(parsed: ParsedArgs, flag: string): string | undefined {
  const value = parsed.flags.get(flag);
  return typeof value === "string" ? value : undefined;
}

function dataDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "data");
}

/** CLI version, read from the published package.json (never hardcoded). */
function cliVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8"),
    ) as { version?: unknown };
    return typeof pkg.version === "string" ? pkg.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    console.log(HELP);
    return 0;
  }
  if (argv[0] === "--version" || argv[0] === "-v") {
    console.log(`arche ${cliVersion()}`);
    return 0;
  }
  const [command, ...rest] = argv as [string, ...string[]];
  const parsed = parseArgs(rest);
  const app = flagValue(parsed, "--app");

  switch (command) {
    case "login": {
      const { resolveAppUrl } = await import("./config.js");
      if (parsed.flags.has("--token-env")) {
        return loginWithTokenEnv(resolveAppUrl(app));
      }
      if (parsed.flags.has("--token")) {
        return loginWithToken(resolveAppUrl(app));
      }
      return loginBrowser(resolveAppUrl(app));
    }
    case "logout":
      return commandLogout();
    case "whoami":
      return commandWhoami();
    case "init":
      return commandInit(parsed.positionals[0], { app });
    case "add": {
      const versionRaw = flagValue(parsed, "--version");
      const version = versionRaw === undefined ? undefined : Number(versionRaw);
      if (versionRaw !== undefined && !Number.isInteger(version)) {
        console.error(`arche add: --version expects an integer, got \`${versionRaw}\`.`);
        return 1;
      }
      return commandAdd(parsed.positionals, {
        library: flagValue(parsed, "--library"),
        version,
      });
    }
    case "install":
      return commandInstall({ library: flagValue(parsed, "--library") });
    case "list":
      return commandList({ library: flagValue(parsed, "--library") });
    case "check": {
      const strict = parsed.flags.has("--strict");
      const result = runCheck(process.cwd(), dataDir());
      if (result.findings.length === 0) {
        console.log(`arche check: clean — ${result.filesScanned} files, ${result.rules.length} rules.`);
        return 0;
      }
      for (const finding of result.findings) {
        console.log(`${finding.file}:${finding.line} — ${finding.rule}: ${finding.message}`);
      }
      console.log(
        `arche check: ${result.findings.length} finding(s) in ${result.filesScanned} files (advisory${strict ? ", strict mode" : ""}).`,
      );
      return strict ? 1 : 0;
    }
    case "doctor":
      return commandDoctor();
    default:
      console.error(`arche: unknown command \`${command}\`. Run \`arche --help\`.`);
      return 1;
  }
}

const exitCode = await main();
process.exit(exitCode);
