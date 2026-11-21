/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordToggleField, PasswordToggleFieldInput } from "@/components/ui/password-toggle-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const authSignupVariants = cva("", {
  variants: {
    layout: {
      centered: "mx-auto w-full max-w-md py-16",
      split: "mx-auto grid w-full max-w-4xl items-stretch gap-6 px-6 py-16 md:grid-cols-2",
    },
  },
  defaultVariants: { layout: "centered" },
});

export interface AuthSignupProps extends VariantProps<typeof authSignupVariants> {
  headline?: string;
  className?: string;
}

function AuthSignup({ headline = "Create your account", layout, className }: AuthSignupProps) {
  const [email, setEmail] = React.useState("");
  const [accepted, setAccepted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid crew email.");
      return;
    }
    setError(null);
  };
  return (
    <section data-block="auth-signup" className={cn(authSignupVariants({ layout }), className)}>
      {layout === "split" ? (
        <div aria-hidden className="hidden rounded-xl border border-(length:--border-width) border-border bg-gradient-to-br from-primary/25 via-card to-card md:block" />
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{headline}</CardTitle>
          <CardDescription>One account for every board, dock, and lane.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-name">Full name</Label>
              <Input id="signup-name" autoComplete="name" placeholder="Maya Chen" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-email">Crew email</Label>
              <Input id="signup-email" type="email" autoComplete="email" placeholder="crew@acme.inc" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? "signup-error" : undefined} />
              {error ? (
                <p id="signup-error" role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-password">Password</Label>
              <PasswordToggleField>
                <PasswordToggleFieldInput id="signup-password" autoComplete="new-password" placeholder="Show password" />
              </PasswordToggleField>
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-muted-foreground">
              <Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} aria-label="Accept the terms" />
              <span>
                I accept the <a href="#terms" className="underline">terms</a> and the packing-floor code.
              </span>
            </label>
            <Button type="submit" disabled={!accepted}>
              Create account
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

export { AuthSignup, authSignupVariants };
