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
  lines.push("", "// coming with the Arche CLI (Brief #4):", `// arche init ${username}/${slug} && arche install`);
  return (
    <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-card p-3 text-xs text-card-foreground">
      {lines.join("\n")}
    </pre>
  );
}
