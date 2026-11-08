"use client";

import * as React from "react";
import { cn } from "../templates/lib/utils.js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../templates/card.js";
import { Label } from "../templates/label.js";
import { Input } from "../templates/input.js";
import { PasswordToggleField, PasswordToggleFieldInput } from "../templates/password-toggle-field.js";
import { Checkbox } from "../templates/checkbox.js";
import { Button } from "../templates/button.js";

export interface AuthSignupProps {
  headline?: string;
  className?: string;
}

function AuthSignup({ headline = "Create your account", className }: AuthSignupProps) {
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
    <section data-block="auth-signup" className={cn("mx-auto w-full max-w-md py-16", className)}>
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

export { AuthSignup };
