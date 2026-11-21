/**
 * Installs the Default identity's components into apps/web the way a user
 * installs a library: from emitted registry items, as copied source files.
 * Runs the same buildRegistry emission as publish — never hand-edit output.
 *
 * Usage: pnpm --filter web sync-components
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..");
const repoRoot = join(webRoot, "..", "..");

const require = createRequire(join(webRoot, "package.json"));
const { buildRegistry } = require("@arche/registry-core");

const identity = JSON.parse(
  readFileSync(join(repoRoot, "fixtures", "identity.default.json"), "utf8"),
);

const items = buildRegistry(identity);
let count = 0;
for (const [name, json] of items) {
  if (name === "theme" || name === "all") {
    continue;
  }
  const item = JSON.parse(json);
  for (const file of item.files ?? []) {
    const target = join(webRoot, file.target);
    mkdirSync(dirname(target), { recursive: true });
    const header =
      `/** GENERATED from the Default identity (fixtures/identity.default.json).\n` +
      ` * Do not hand-edit — re-run: pnpm --filter web sync-components */\n`;
    writeFileSync(target, header + file.content.replace(/^"use client"\n/, '"use client"\n'));
    count++;
  }
}
console.log(`sync-components: wrote ${count} files from ${identity.meta.name}`);
