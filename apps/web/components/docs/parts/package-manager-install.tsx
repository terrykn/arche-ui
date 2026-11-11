"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

const MANAGERS = [
  { id: "npm", label: "npm", command: "npx @arche/cli login" },
  { id: "pnpm", label: "pnpm", command: "pnpm dlx @arche/cli login" },
  { id: "yarn", label: "yarn", command: "yarn dlx @arche/cli login" },
  { id: "bun", label: "bun", command: "bunx @arche/cli login" },
];

// Interactive block used by the Installation page data file.
export function PackageManagerInstall() {
  const [manager, setManager] = React.useState(MANAGERS[0]!);
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(manager.command);
    } catch {
      // clipboard unavailable
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2600);
  };

  return (
    <div className="proto-pm">
      <div className="proto-pm-tabs" role="tablist" aria-label="Package manager">
        {MANAGERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === manager.id}
            className={`proto-pm-tab${item.id === manager.id ? " active" : ""}`}
            onClick={() => setManager(item)}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          className="proto-copy-btn"
          onClick={copy}
          aria-label="Copy install command"
        >
          {copied ? (
            <Check size={15} aria-hidden="true" />
          ) : (
            <Copy size={15} aria-hidden="true" />
          )}
        </button>
      </div>
      <div className="proto-code proto-mono">{manager.command}</div>
    </div>
  );
}
