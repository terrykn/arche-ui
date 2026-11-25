"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [copied, setCopied] = React.useState(false);
  const hero = "arche install";
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
  lines.push("  }", "", "pnpm dlx shadcn@latest add @arche-ui/all");
  if (authed) {
    lines.push("REGISTRY_TOKEN=<paste from dashboard settings>");
  }
  return (
    <div className="mt-2 overflow-hidden rounded-lg border-(length:--border-width) border-border">
      <div className="flex items-center justify-between gap-3 bg-muted px-4 py-3">
        <code className="truncate font-mono text-sm">{hero}</code>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            void navigator.clipboard.writeText(hero).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2600);
            });
          }}
          aria-live="polite"
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto bg-card p-4 font-mono text-xs leading-relaxed text-card-foreground">
        {lines.join("\n")}
      </pre>
    </div>
  );
}
