/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const newsletterSignupVariants = cva("", {
  variants: {
    layout: {
      centered: "mx-auto w-full max-w-2xl py-16",
      split: "mx-auto grid w-full max-w-5xl items-start gap-8 px-6 py-16 md:grid-cols-2",
    },
  },
  defaultVariants: { layout: "centered" },
});

export interface NewsletterSignupProps extends VariantProps<typeof newsletterSignupVariants> {
  headline?: string;
  subhead?: string;
  className?: string;
}

function NewsletterSignup({ headline = "The Friday pack report", subhead = "Throughput, cutoffs, and one packing tip. Monthly, no noise.", layout, className }: NewsletterSignupProps) {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid crew email.");
      return;
    }
    setError(null);
    setDone(true);
  };
  return (
    <section data-block="newsletter-signup" className={cn(newsletterSignupVariants({ layout }), className)}>
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{headline}</h2>
        <p className="mt-2 text-muted-foreground">{subhead}</p>
      </div>
      {done ? (
        <p role="status" className={cn("mt-4 rounded-md border border-(length:--border-width) border-border bg-card p-4 text-sm text-foreground", layout === "split" && "md:mt-0")}>
          You are on the list — see you Friday.
        </p>
      ) : (
        <form onSubmit={submit} className={cn("mt-4 flex flex-col gap-3", layout === "split" && "md:mt-0")} noValidate>
          <Label htmlFor="newsletter-email">Crew email</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="newsletter-email"
              type="email"
              autoComplete="email"
              placeholder="crew@acme.inc"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "newsletter-error" : undefined}
              className="flex-1"
            />
            <Button type="submit">Subscribe</Button>
          </div>
          {error ? (
            <p id="newsletter-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </section>
  );
}

export { NewsletterSignup, newsletterSignupVariants };
