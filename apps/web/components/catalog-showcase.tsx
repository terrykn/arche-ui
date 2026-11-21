"use client";
import * as React from "react";
import { REGISTRY_EXAMPLE_NAMES, RegistryExample } from "@/components/registry-example";

const title = (name: string) => name.split("-").map((w) => (w === "otp" ? "OTP" : w[0]!.toUpperCase() + w.slice(1))).join(" ");

/** Full-catalog showcase, skinned by overriding CSS vars. */
export function CatalogShowcase({ vars, mode = "light" }: { vars: Record<string, string>; mode?: "light" | "dark" }) {
  return (
    <div className={mode === "dark" ? "dark" : ""}>
      <div style={vars as React.CSSProperties} className="bg-background text-foreground">
        {REGISTRY_EXAMPLE_NAMES.map((name) => (
          <section key={name} data-component={title(name)} className="border-b-(length:--border-width) py-4">
            <h2 className="mb-2 font-semibold">{title(name)}</h2>
            <RegistryExample name={name} />
          </section>
        ))}
      </div>
    </div>
  );
}