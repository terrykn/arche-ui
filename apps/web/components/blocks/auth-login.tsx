/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordToggleField, PasswordToggleFieldInput } from "@/components/ui/password-toggle-field";
import { Button } from "@/components/ui/button";

const authLoginVariants = cva("", {
  variants: {
    layout: {
      centered: "mx-auto w-full max-w-md py-16",
      split: "mx-auto grid w-full max-w-4xl items-stretch gap-6 px-6 py-16 md:grid-cols-2",
    },
  },
  defaultVariants: { layout: "centered" },
});

export interface AuthLoginProps extends VariantProps<typeof authLoginVariants> {
  headline?: string;
  subhead?: string;
  className?: string;
}

function AuthLogin({ headline = "Welcome back", subhead = "Sign in to today's board.", layout, className }: AuthLoginProps) {
  const [email, setEmail] = React.useState("");
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
    <section data-block="auth-login" className={cn(authLoginVariants({ layout }), className)}>
      {layout === "split" ? (
        <div aria-hidden className="hidden rounded-xl border border-(length:--border-width) border-border bg-gradient-to-br from-primary/25 via-card to-card md:block" />
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{headline}</CardTitle>
          <CardDescription>{subhead}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="login-email">Crew email</Label>
              <Input id="login-email" type="email" autoComplete="email" placeholder="crew@acme.inc" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? "login-error" : undefined} />
              {error ? (
                <p id="login-error" role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="login-password">Password</Label>
              <PasswordToggleField>
                <PasswordToggleFieldInput id="login-password" autoComplete="current-password" placeholder="Show password" />
              </PasswordToggleField>
            </div>
            <Button type="submit">Continue</Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            New to the floor? <a href="#signup" className="underline">Create an account</a>
          </p>
        </CardFooter>
      </Card>
    </section>
  );
}

export { AuthLogin, authLoginVariants };
