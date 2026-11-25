import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCatalogManifests } from "@arche-ui/registry-core";

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Copy-paste source for one catalog item: the generated file users would
 * install (`components/ui/<name>.tsx` or `components/blocks/<name>.tsx`).
 * Strictly validated — kind is a fixed pair, name is kebab-case — so no
 * path traversal is possible.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const name = searchParams.get("name");
  if ((kind !== "component" && kind !== "block") || !name || !NAME_RE.test(name)) {
    return NextResponse.json(
      { error: "expected ?kind=component|block&name=<kebab-case-name>" },
      { status: 400 },
    );
  }
  const path = `components/${kind === "component" ? "ui" : "blocks"}/${name}.tsx`;
  try {
    const raw = await readFile(join(process.cwd(), path), "utf8");
    // Drop the GENERATED header so the pasted source is just the component.
    const code = raw.replace(/^\/\*\* GENERATED from[\s\S]*?\*\/\s*/, "");
    const manifest = getCatalogManifests().find((entry) => entry.name === name);
    const extraCommands = (manifest?.registryDependencies ?? []).map((dep) => `arche add ${dep}`);
    return NextResponse.json({ kind, name, path, code, extraCommands });
  } catch {
    return NextResponse.json({ error: "source not found" }, { status: 404 });
  }
}
