/** Shared install instructions (dashboard detail + public identity page). */
export function InstallBlock({
  base,
  username,
  slug,
  authed,
}: {
  base: string;
  username: string;
  slug: string;
  authed: boolean;
}) {
  const lines = [
    "// Arche CLI (recommended)",
    "arche login",
    `arche init ${username}/${slug} && arche install`,
    "// or install single components:",
    `// arche add button dialog`,
    "",
    "// Manual / advanced (stock shadcn CLI)",
    "// components.json",
    "{",
    '  "registries": {',
    `    "@arche": "${base}/{name}.json"`,
  ];
  if (authed) {
    lines.push(
      "    // private library — send your registry token:",
      '    // headers: { "Authorization": "Bearer ${REGISTRY_TOKEN}" },',
    );
  }
  lines.push("  }", "", "pnpm dlx shadcn@latest add @arche/all");
  if (authed) {
    lines.push("REGISTRY_TOKEN=<paste from dashboard settings>");
  }
  return (
    <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-card p-3 text-xs text-card-foreground">
      {lines.join("\n")}
    </pre>
  );
}
