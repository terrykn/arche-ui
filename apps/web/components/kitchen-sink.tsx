"use client";

import { Send, TrendingDown, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OneTimePasswordField, OneTimePasswordFieldInput, OneTimePasswordFieldHiddenInput } from "@/components/ui/one-time-password-field";
import { PasswordToggleField, PasswordToggleFieldInput, PasswordToggleFieldToggle } from "@/components/ui/password-toggle-field";
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
export function KitchenSink() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {/* 1 — Title, subtitle, primary button */}
      <Card>
        <CardHeader>
          <CardTitle>Acme Fulfillment ships for you</CardTitle>
          <CardDescription>Warehousing, packing, and delivery in one dashboard.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button>Start shipping</Button>
        </CardFooter>
      </Card>

      {/* 2 — Sign in */}
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Welcome back to your Acme workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => event.preventDefault()} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sink-signin-email">Email</Label>
              <Input id="sink-signin-email" type="email" placeholder="maya@acme.inc" autoComplete="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sink-signin-password">Password</Label>
              <PasswordToggleField>
                <PasswordToggleFieldInput id="sink-signin-password" autoComplete="current-password" />
                <PasswordToggleFieldToggle>Show</PasswordToggleFieldToggle>
              </PasswordToggleField>
            </div>
            <Button type="submit" className="w-full">Sign in</Button>
          </form>
        </CardContent>
      </Card>

      {/* 3 — Form: dropdown, multiple choice, textarea, submit */}
      <Card>
        <CardHeader>
          <CardTitle>Request a quote</CardTitle>
          <CardDescription>Tell us what you ship and we price it.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => event.preventDefault()} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sink-quote-plan">Plan</Label>
              <Select>
                <SelectTrigger id="sink-quote-plan">
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
                  <RadioGroupItem value="monthly" id="sink-billing-monthly" />
                  <Label htmlFor="sink-billing-monthly">Monthly</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="annual" id="sink-billing-annual" />
                  <Label htmlFor="sink-billing-annual">Annual · save 20%</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sink-quote-notes">Notes</Label>
              <Textarea id="sink-quote-notes" placeholder="Fragile goods, cold storage, …" />
            </div>
            <Button type="submit">Get quote</Button>
          </form>
        </CardContent>
      </Card>

      {/* 4 — Latest activity */}
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
      </Card>

      {/* 5 — Stock price + badge */}
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
      </Card>

      {/* 6 — Sales bar chart */}
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
      </Card>

      {/* 7 — Chatbot input */}
      <Card>
        <CardHeader>
          <CardTitle>Acme assistant</CardTitle>
        </CardHeader>
        <CardContent className="grid min-h-56 content-between gap-6">
          <div className="pt-4 text-center">
            <p className="text-lg font-medium">How can I help today?</p>
            <p className="mt-1 text-sm text-muted-foreground">Ask about orders, stock, or invoices.</p>
          </div>
          <form onSubmit={(event) => event.preventDefault()} className="flex gap-2">
            <Input aria-label="Chat message" placeholder="Ask anything…" className="flex-1" />
            <Button type="submit" size="icon" aria-label="Send message">
              <Send className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 8 — Two-step verification */}
      <Card>
        <CardHeader>
          <CardTitle>Two-step verification</CardTitle>
          <CardDescription>Enter the 6-digit code from your authenticator app.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => event.preventDefault()} className="grid justify-items-center gap-4">
            <OneTimePasswordField name="sink-otp" aria-label="Verification code">
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
      </Card>

      {/* 9 — Checkboxes + wide button */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what lands in your inbox.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex items-center gap-2">
            <Checkbox id="sink-notify-shipments" defaultChecked />
            <Label htmlFor="sink-notify-shipments">Shipment updates</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="sink-notify-invoices" defaultChecked />
            <Label htmlFor="sink-notify-invoices">Invoices and receipts</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="sink-notify-marketing" />
            <Label htmlFor="sink-notify-marketing">Product news</Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Save preferences</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
