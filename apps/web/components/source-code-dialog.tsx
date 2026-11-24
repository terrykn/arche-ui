"use client";

import * as React from "react";
import { Check, Code2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Source-code button for a component/block header: opens a modal with the
 * item's generated source to copy-paste, plus the install command for the
 * user's own app in the footer.
 */
export function SourceCodeDialog({ kind, name }: { kind: "component" | "block"; name: string }) {
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState<string | null>(null);
  const [extraCommands, setExtraCommands] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedInstall, setCopiedInstall] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setCode(null);
    setExtraCommands([]);
    setError(null);
    let cancelled = false;
    fetch(`/api/source?kind=${kind}&name=${encodeURIComponent(name)}`)
      .then((response) => {
        if (!response.ok) throw new Error("not found");
        return response.json() as Promise<{ code?: unknown; extraCommands?: unknown }>;
      })
      .then((body) => {
        if (cancelled) return;
        if (typeof body.code !== "string") throw new Error("bad response");
        setCode(body.code);
        setExtraCommands(
          Array.isArray(body.extraCommands)
            ? body.extraCommands.filter((entry): entry is string => typeof entry === "string")
            : [],
        );
      })
      .catch(() => {
        if (!cancelled) setError("Source is not available for this item.");
      });
    return () => {
      cancelled = true;
    };
  }, [open, kind, name]);

  const install = `arche add ${name}`;
  const allCommands = [install, ...extraCommands].join("\n");

  const copyText = (text: string, done: (value: boolean) => void) => {
    void navigator.clipboard.writeText(text).then(() => {
      done(true);
      window.setTimeout(() => done(false), 2600);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={`View ${name} source code`}
          title="View source code"
        >
          <Code2 aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85dvh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>{name}.tsx</DialogTitle>
        </DialogHeader>
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-md border border-border">
          {code ? (
            <pre className="max-h-[50dvh] overflow-auto bg-muted/40 p-4 font-mono text-xs leading-relaxed">
              {code}
            </pre>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">{error ?? "Loading source…"}</p>
          )}
          {code ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute right-5 top-3"
              onClick={() => copyText(code, setCopiedCode)}
              aria-live="polite"
            >
              {copiedCode ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copiedCode ? "Copied" : "Copy"}
            </Button>
          ) : null}
        </div>
        <DialogFooter className="flex-col items-stretch gap-2">
          <div className="flex flex-row items-center justify-between gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-muted/40 px-2.5 py-1.5 font-mono text-xs">
              {install}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => copyText(allCommands, setCopiedInstall)}
              aria-live="polite"
            >
              {copiedInstall ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copiedInstall ? "Copied" : "Copy install command"}
            </Button>
          </div>
          {extraCommands.map((command) => (
            <code
              key={command}
              className="truncate rounded-md border border-border bg-muted/40 px-2.5 py-1.5 font-mono text-xs text-muted-foreground"
            >
              {command}
            </code>
          ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
