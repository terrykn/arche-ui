import fs from "node:fs";
import path from "node:path";

const web = path.resolve("apps/web");
const ui = path.join(web, "components/ui");
const appUi = path.join(web, "components/app-ui");

// These consume the NEW registry API and stay on components/ui.
const registryConsumers = new Set([
  "components/catalog-showcase.tsx",
  "components/demo-app.tsx",
  "components/registry-example.tsx",
]);
// Generated or rerun-only paths.
const skipped = ["node_modules", ".next", "scripts", "components/ui", "components/blocks", "components/docs/parts", "app/components"];

if (fs.existsSync(appUi)) throw new Error("components/app-ui already exists; refusing to overwrite the frozen set.");
fs.cpSync(ui, appUi, { recursive: true });

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    const rel = path.relative(web, file).split(path.sep).join("/");
    if (skipped.some((s) => rel === s || rel.startsWith(`${s}/`) || entry.name === "node_modules")) continue;
    if (entry.isDirectory()) walk(file);
    else if (/\.tsx?$/.test(file) && !registryConsumers.has(rel)) rewrite(file);
  }
}

function rewrite(file) {
  const before = fs.readFileSync(file, "utf8");
  const after = before
    .replace(/(["'])@\/components\/ui\//g, "$1@/components/app-ui/")
    .replace(/(["'])(\.{1,2}\/[^"'\n]+)\1/g, (match, quote, spec) => {
      const target = path.resolve(path.dirname(file), spec);
      if (!target.startsWith(ui + path.sep)) return match;
      let next = path.relative(path.dirname(file), path.join(appUi, path.relative(ui, target))).split(path.sep).join("/");
      if (!next.startsWith(".")) next = `./${next}`;
      return `${quote}${next}${quote}`;
    });
  if (after !== before) {
    fs.writeFileSync(file, after);
    console.log("repointed", path.relative(web, file));
  }
}

walk(web);