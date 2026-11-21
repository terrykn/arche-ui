/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface SettingsPageProps {
  title?: string;
  className?: string;
}

function SettingsPage({ title = "Workspace settings", className }: SettingsPageProps) {
  const [name, setName] = React.useState("Oakland warehouse");
  const [email, setEmail] = React.useState("crew@acme.inc");
  const [errors, setErrors] = React.useState<{ name?: string; email?: string }>({});
  const [saved, setSaved] = React.useState(false);
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const next: { name?: string; email?: string } = {};
    if (!name.trim()) next.name = "Name the workspace.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid crew email.";
    setErrors(next);
    setSaved(Object.keys(next).length === 0);
  };
  return (
    <section data-block="settings-page" className={cn("mx-auto flex w-full max-w-2xl flex-col gap-6", className)}>
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How the workspace introduces itself on slips and boards.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-name">Workspace name</Label>
              <Input id="settings-name" value={name} onChange={(event) => setName(event.target.value)} aria-invalid={errors.name ? true : undefined} />
              {errors.name ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.name}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-email">Crew email</Label>
              <Input id="settings-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={errors.email ? true : undefined} />
              {errors.email ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.email}
                </p>
              ) : null}
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-medium">Notify on ship</span>
                <span className="block text-sm text-muted-foreground">Ping the crew channel per parcel.</span>
              </span>
              <Switch defaultChecked aria-label="Notify on ship" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-medium">Weekend shifts</span>
                <span className="block text-sm text-muted-foreground">Show Saturday on the board.</span>
              </span>
              <Switch aria-label="Weekend shifts" />
            </div>
            {saved ? (
              <p role="status" className="text-sm text-muted-foreground">
                Saved — the board already shows it.
              </p>
            ) : null}
          </form>
        </CardContent>
        <CardFooter>
          <Button onClick={save}>Save settings</Button>
        </CardFooter>
      </Card>
    </section>
  );
}

export { SettingsPage };
