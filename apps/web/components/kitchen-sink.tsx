"use client";

import { Fragment, useState, type ReactNode } from "react";
import { Moon, Send, Sun, TrendingDown, TrendingUp } from "lucide-react";
import { Carousel } from "./carousel";
import { DEMO_IDENTITIES, siteSlug } from "./demo-identities";
import { DemoSkin } from "./story-screens";
import { TypedPrompt } from "./typed-prompt";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OneTimePasswordField, OneTimePasswordFieldInput, OneTimePasswordFieldHiddenInput } from "@/components/ui/one-time-password-field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const ACTIVITY = [
  { initials: "MC", name: "Maya Chen", text: "restocked packing tape", time: "2m ago" },
  { initials: "JR", name: "Jon Reyes", text: "shipped order #4821", time: "18m ago" },
  { initials: "PS", name: "Priya Shah", text: "approved refund #1093", time: "1h ago" },
  { initials: "TO", name: "Tom Okafor", text: "added 12 new tasks", time: "3h ago" },
];

const WEEK_SALES = [
  { day: "Mon", value: 42 },
  { day: "Tue", value: 68 },
  { day: "Wed", value: 51 },
  { day: "Thu", value: 80 },
  { day: "Fri", value: 63 },
  { day: "Sat", value: 95 },
  { day: "Sun", value: 74 },
];

/**
 * Kitchen sink: everyday product UI in one place — marketing card, auth,
 * forms, lists, finance, chat, verification, and preferences.
 */
function sinkCards(ns: string): ReactNode[] {
  return [
      // 1 — Title, subtitle, primary button
      <Card>
        <CardHeader>
          <CardTitle>Acme Fulfillment ships for you</CardTitle>
          <CardDescription>Warehousing, packing, and delivery in one dashboard.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button>Start shipping</Button>
        </CardFooter>
      </Card>,

      // 2 — Sign in
      <Card>
        <CardContent>
          <form onSubmit={(event) => event.preventDefault()} className="flex h-full flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="${ns}-signin-email">Email</Label>
              <Input id="${ns}-signin-email" type="email" placeholder="maya@acme.inc" autoComplete="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="${ns}-signin-password">Password</Label>
              <Input id="${ns}-signin-password" type="password" placeholder="••••••••" autoComplete="current-password" />
            </div>
            <Button type="submit" className="mt-auto w-full">Sign in</Button>
          </form>
        </CardContent>
      </Card>,

      // 3 — Form: dropdown, multiple choice, textarea, submit
      <Card>
        <CardHeader>
          <CardTitle>Request a quote</CardTitle>
          <CardDescription>Tell us what you ship and we price it.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => event.preventDefault()} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="${ns}-quote-plan">Plan</Label>
              <Select>
                <SelectTrigger id="${ns}-quote-plan">
                  <SelectValue placeholder="Pick a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter · 100 orders/mo</SelectItem>
                  <SelectItem value="growth">Growth · 1k orders/mo</SelectItem>
                  <SelectItem value="scale">Scale · unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Billing</Label>
              <RadioGroup defaultValue="monthly" aria-label="Billing period">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="monthly" id="${ns}-billing-monthly" />
                  <Label htmlFor="${ns}-billing-monthly">Monthly</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="annual" id="${ns}-billing-annual" />
                  <Label htmlFor="${ns}-billing-annual">Annual · save 20%</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="${ns}-quote-notes">Notes</Label>
              <Textarea id="${ns}-quote-notes" placeholder="Fragile goods, cold storage, …" />
            </div>
            <Button type="submit">Get quote</Button>
          </form>
        </CardContent>
      </Card>,

      // 4 — Latest activity
      <Card>
        <CardHeader>
          <CardTitle>Latest activity</CardTitle>
          <CardDescription>What your team did today.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {ACTIVITY.map((row, index) => (
            <div key={row.name}>
              {index > 0 ? <Separator className="mb-3" /> : null}
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{row.initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm"><span className="font-medium">{row.name}</span> {row.text}</p>
                  <p className="text-xs text-muted-foreground">{row.time}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>,

      // 5 — Stock price + badge
      <Card>
        <CardHeader>
          <CardTitle>ACME · Nasdaq</CardTitle>
          <CardDescription>Delayed 15 min · USD</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">$184.32</p>
            <Badge className="border-transparent bg-emerald-600 text-white">
              <TrendingUp className="size-3" /> +2.4%
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">$96.10</p>
            <Badge variant="destructive">
              <TrendingDown className="size-3" /> −1.1%
            </Badge>
          </div>
        </CardContent>
      </Card>,

      // 6 — Sales bar chart
      <Card>
        <CardHeader>
          <CardTitle>Sales this week</CardTitle>
          <CardDescription>$12,480 total · 312 orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-36 items-end gap-2" role="img" aria-label="Bar chart of sales, Monday through Sunday, peaking Saturday">
            {WEEK_SALES.map((bar) => (
              <div key={bar.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div className="w-full rounded-sm bg-primary" style={{ height: `${bar.value}%` }} />
                <span className="text-[11px] text-muted-foreground">{bar.day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>,

      // 7 — Chatbot input
      <Card>
        <CardHeader>
          <CardTitle>Acme assistant</CardTitle>
        </CardHeader>
        <CardContent className="grid min-h-56 content-between gap-6">
          <div className="pt-4 text-center">
            <p className="text-lg font-medium">How can I help today?</p>
            <p className="mt-1 text-sm text-muted-foreground">Ask about orders, stock, or invoices.</p>
          </div>
          <form onSubmit={(event) => event.preventDefault()} className="mt-auto flex gap-2">
            <Input aria-label="Chat message" placeholder="Ask anything…" className="flex-1" />
            <Button type="submit" size="icon" aria-label="Send message">
              <Send className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>,

      // 8 — Two-step verification
      <Card>
        <CardHeader>
          <CardTitle>Two-step verification</CardTitle>
          <CardDescription>Enter the 6-digit code from your authenticator app.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => event.preventDefault()} className="grid justify-items-center gap-4">
            <OneTimePasswordField name="${ns}-otp" aria-label="Verification code">
              <OneTimePasswordFieldInput />
              <OneTimePasswordFieldInput />
              <OneTimePasswordFieldInput />
              <OneTimePasswordFieldInput />
              <OneTimePasswordFieldInput />
              <OneTimePasswordFieldInput />
              <OneTimePasswordFieldHiddenInput />
            </OneTimePasswordField>
            <div className="flex gap-2">
              <Button type="submit">Verify</Button>
              <Button type="button" variant="ghost">Resend code</Button>
            </div>
          </form>
        </CardContent>
      </Card>,

      // 10 — Brand moments (Brand Token brief): the ONLY surfaces that
      // spend the brand — brand button, brand badge, brand card. Both
      // modes render from the same AA-gated contract pairs.
      <Card variant="brand">
        <CardHeader>
          <CardTitle>Harbor sale week</CardTitle>
          <CardDescription>Members save an extra 20% through Sunday.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant="brand">Sale · −20%</Badge>
          <Badge variant="secondary">Members</Badge>
        </CardContent>
        <CardFooter className="gap-2">
          <Button variant="brand">Shop the sale</Button>
          <Button variant="secondary">Details</Button>
        </CardFooter>
      </Card>,

      // 9 — Checkboxes + wide button
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what lands in your inbox.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex items-center gap-2">
            <Checkbox id="${ns}-notify-shipments" defaultChecked />
            <Label htmlFor="${ns}-notify-shipments">Shipment updates</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="${ns}-notify-invoices" defaultChecked />
            <Label htmlFor="${ns}-notify-invoices">Invoices and receipts</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="${ns}-notify-marketing" />
            <Label htmlFor="${ns}-notify-marketing">Product news</Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Save preferences</Button>
        </CardFooter>
      </Card>,
  ];
}

// Sales preview card: one number, % change beneath it, chart underneath.
function sinkSalesCard(): ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div>
          <p className="text-2xl font-semibold">$12,480</p>
          <Badge className="mt-2 border-transparent bg-emerald-600 text-white">
            <TrendingUp className="size-3" /> +2.4%
          </Badge>
        </div>
        <div className="mt-auto flex h-20 items-end gap-2" role="img" aria-label="Bar chart of sales, Monday through Sunday, peaking Saturday">
          {WEEK_SALES.map((bar) => (
            <div key={bar.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <div className="w-full rounded-sm bg-primary" style={{ height: `${bar.value}%` }} />
              <span className="text-[11px] text-muted-foreground">{bar.day}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function KitchenSink({ ns = "sink" }: { ns?: string } = {}) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {sinkCards(ns).map((card, index) => (
        <Fragment key={index}>{card}</Fragment>
      ))}
    </div>
  );
}

// Compact preview: one row of 3 — assistant, sign in, sales. Namespaced
// ids keep the repeated slides valid when several identities sit on one page.
export function SinkPreview({ ns, className }: { ns: string; className?: string }) {
  const cards = sinkCards(ns);
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [&_[data-slot=card]]:gap-3 [&_[data-slot=card]]:py-3 [&_[data-slot=card-content]]:min-h-0 [&_[data-slot=card-content]]:flex-1 [&_[data-slot=card-content]]:px-4 [&_[data-slot=card-footer]]:px-4 [&_[data-slot=card-header]]:px-4${className ? ` ${className}` : ""}`}>
      <Fragment key="assistant">{cards[6]}</Fragment>
      <Fragment key="signin">{cards[1]}</Fragment>
      <Fragment key="sales">{sinkSalesCard()}</Fragment>
    </div>
  );
}

// One carousel slide: prompt row with a dark/light toggle pinned right,
// preview below. Defaults to dark mode.
function SinkSlide({ identity }: { identity: (typeof DEMO_IDENTITIES)[number] }) {
  const [dark, setDark] = useState(true);
  return (
    <DemoSkin identity={identity} dark={dark}>
      <div className="flex items-center gap-3 p-5 pb-4">
        <div className="min-w-0 flex-1">
          <TypedPrompt text={identity.prompt} />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={dark}
          onClick={() => setDark((value) => !value)}
          className="shrink-0 rounded-full"
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>
      <div className="p-5 pt-0">
        <SinkPreview ns={siteSlug(identity.name)} className={identity.name === "Meridian" ? "font-sans" : undefined} />
      </div>
    </DemoSkin>
  );
}

// The full sink grid per screen, each slide re-skinned in a different
// generated identity — same components, different UI.
export function SinkCarousel() {
  return (
    <Carousel slideClassName="w-full shrink-0 snap-start" label="Kitchen sink">
      {DEMO_IDENTITIES.map((identity) => (
        <SinkSlide key={identity.name} identity={identity} />
      ))}
    </Carousel>
  );
}
