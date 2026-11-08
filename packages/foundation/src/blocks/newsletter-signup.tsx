"use client";

import * as React from "react";
import { cn } from "../templates/lib/utils.js";
import { Label } from "../templates/label.js";
import { Input } from "../templates/input.js";
import { Button } from "../templates/button.js";

export interface NewsletterSignupProps {
  headline?: string;
  subhead?: string;
  className?: string;
}

function NewsletterSignup({ headline = "The Friday pack report", subhead = "Throughput, cutoffs, and one packing tip. Monthly, no noise.", className }: NewsletterSignupProps) {
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
    <section data-block="newsletter-signup" className={cn("mx-auto w-full max-w-2xl py-16", className)}>
      <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{headline}</h2>
      <p className="mt-2 text-muted-foreground">{subhead}</p>
      {done ? (
        <p role="status" className="mt-4 rounded-md border border-(length:--border-width) border-border bg-card p-4 text-sm text-foreground">
          You are on the list — see you Friday.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3" noValidate>
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

export { NewsletterSignup };
