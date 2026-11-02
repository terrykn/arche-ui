"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const MANAGERS = [
  { id: "npm", label: "npm", command: "npx @arche/cli login" },
  { id: "pnpm", label: "pnpm", command: "pnpm dlx @arche/cli login" },
  { id: "yarn", label: "yarn", command: "yarn dlx @arche/cli login" },
  { id: "bun", label: "bun", command: "bunx @arche/cli login" },
];

export default function Installation() {
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
    <div>
      <span className="proto-chip">Getting Started</span>
      <h1>Installation</h1>
      <p className="proto-lede">Get started with Arche in just a few steps.</p>
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
        <button type="button" className="proto-copy-btn" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="proto-code proto-mono" style={{ marginTop: 12 }}>
        {manager.command}
      </div>
      <div className="proto-steps">
        <div className="proto-step">
          <div>
            <strong>Log in with the CLI</strong>
            <p>Authenticate once — your registry token is stored locally and used for every install.</p>
          </div>
        </div>
        <div className="proto-step">
          <div>
            <strong>Initialize, then add components</strong>
            <p>Point your project at a library, then add components by name. Source files land in your project.</p>
          </div>
        </div>
        <div className="proto-step">
          <div>
            <strong>Connect our MCP server</strong>
            <p>Give your AI agents the same manifests you read — variants, tokens, and usage standards.</p>
          </div>
        </div>
      </div>
      <div className="proto-help-banner">
        Need help? <Link href="/docs/quick-start">Check out our quick start guide <ArrowRight size={14} aria-hidden="true" style={{ verticalAlign: "-0.2em" }} /></Link>
      </div>
    </div>
  );
}
