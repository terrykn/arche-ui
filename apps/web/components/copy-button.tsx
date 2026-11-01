"use client";

import * as React from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      className="proto-btn proto-btn-ghost proto-btn-sm"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2600);
        });
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
