"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

/**
 * Code sample in the same box as the package-manager install block: a label
 * bar on top with a copy button, the code underneath. Instead of one tab per
 * package manager the bar names the file the snippet belongs in.
 */
export function CodeSnippet({
  code,
  label,
  style,
}: {
  code: string;
  label: string;
  style?: React.CSSProperties;
}) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // clipboard unavailable
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2600);
  };

  return (
    <div className="proto-pm" style={style}>
      <div className="proto-pm-tabs">
        <span className="proto-pm-tab active proto-pm-tab-label">{label}</span>
        <button type="button" className="proto-copy-btn" onClick={copy} aria-label={`Copy ${label}`}>
          {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
        </button>
      </div>
      <pre className="proto-code proto-mono" style={{ margin: 0 }}>
        {code}
      </pre>
    </div>
  );
}
