/**
 * Emit CLI — validates an identity, then writes all registry items to disk.
 *
 * Usage: node dist/cli.js <identity.json> [--out <dir>]
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv } from "ajv";
import type { ErrorObject } from "ajv";
import { buildRegistry, validateIdentity, type ArcheIdentity } from "./index.js";

const schemaDir = join(dirname(fileURLToPath(import.meta.url)), "..", "schemas");

type EmitResult = { ok: true; message: string } | { ok: false; code: number; message: string };

const registryItemSchema = JSON.parse(
  readFileSync(join(schemaDir, "registry-item.json"), "utf8"),
) as Record<string, unknown>;
// Ajv 8 core speaks draft-2020 keywords (which this published schema uses for
// its body); the draft-07 meta-$schema marker is only a dialect hint.
delete registryItemSchema["$schema"];

function parseArgv(argv: string[]): { path: string | null; out: string | null } {
  let path: string | null = null;
  let out: string | null = "out";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") {
      out = argv[i + 1] ?? null;
      i++;
    } else if (path === null) {
      path = argv[i] ?? null;
    }
  }
  return { path, out };
}

function loadIdentity(identityPath: string, outDir: string): EmitResult {
  let identity: ArcheIdentity;
  try {
    identity = JSON.parse(readFileSync(identityPath, "utf8")) as ArcheIdentity;
  } catch (error) {
    return { ok: false, code: 1, message: `cannot read identity payload at ${identityPath}: ${(error as Error).message}` };
  }

  // Emission preconditions: contract (token set + contrast) and manifest surfaces
  const validation = validateIdentity(identity);
  if (!validation.ok) {
    const lines = [`identity rejected (${validation.issues.length} issue${validation.issues.length === 1 ? "" : "s"}):`];
    for (const issue of validation.issues) {
      lines.push(`  - ${issue.path}: ${issue.message}`);
    }
    return { ok: false, code: 1, message: lines.join("\n") };
  }

  let items: Map<string, string>;
  try {
    items = buildRegistry(identity);
  } catch (error) {
    return { ok: false, code: 1, message: `buildRegistry failed: ${(error as Error).message}` };
  }

  // Validate emitted items against the published shadcn registry-item schema.
  const validator = new Ajv({
    allErrors: true,
    strict: false,
    validateFormats: false,
  });
  const validateItem = validator.compile(registryItemSchema);

  for (const [name, json] of items) {
    const parsed = JSON.parse(json) as unknown;
    if (!validateItem(parsed)) {
      const lines = [`item '${name}' does not conform to the shadcn registry-item schema:`];
      for (const error of (validator.errors ?? []) as ErrorObject[]) {
        lines.push(`  - ${error.instancePath} ${error.message}`);
      }
      return { ok: false, code: 1, message: lines.join("\n") };
    }
  }

  mkdirSync(outDir, { recursive: true });
  for (const [name, json] of items) {
    const filePath = join(outDir, `${name}.json`);
    writeFileSync(filePath, json, "utf8");
  }

  // Round-trip check: everything written parses back cleanly.
  for (const file of readdirSync(outDir)) {
    if (file.endsWith(".json")) {
      JSON.parse(readFileSync(join(outDir, file), "utf8"));
    }
  }

  return { ok: true, message: `items: ${[...items.keys()].map((name) => `${name}.json`).join(", ")}` };
}

function main(): number {
  const { path, out } = parseArgv(process.argv.slice(2));
  if (!path || !out) {
    console.error("usage: emit <identity.json> [--out <dir>]");
    return 2;
  }
  const identityPath = resolve(process.cwd(), path);
  const outDir = resolve(process.cwd(), out);
  const result = loadIdentity(identityPath, outDir);
  if (result.ok) {
    console.log(`emit: ${result.message}`);
    return 0;
  }
  console.error(`emit: ${result.message}`);
  return result.code;
}

process.exitCode = main();
