"use client";

/**
 * Enterprise demo (replaces the kitchen sink): one realistic, intentional
 * website for Acme Fulfillment — packing, warehousing, and shipping as a
 * service for online stores — rendered under whatever identity's tokens are
 * passed in. This is the single place to edit the demo: /examples, the
 * public identity page, /preview/[name], the Studio edit preview, the
 * /kitchen-sink QA route, and the publish-time captures all render this
 * same component. Every catalog component appears in a realistic spot and
 * keeps its data-* coverage hooks (see scripts/check-enterprise-demo.mjs).
 */
import * as React from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Form, FormField, FormLabel, FormControl, FormMessage, FormSubmit } from "@/components/ui/form";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator } from "@/components/ui/menubar";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Progress, ProgressIndicator } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea, ScrollAreaViewport, ScrollBar, ScrollAreaThumb } from "@/components/ui/scroll-area";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider, SliderTrack, SliderRange, SliderThumb } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Toggle } from "@/components/ui/toggle";
import { Toolbar, ToolbarButton, ToolbarSeparator, ToolbarToggleGroup, ToolbarToggleItem } from "@/components/ui/toolbar";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { BlockPreview } from "@/components/block-preview";
import { SINK_EXAMPLES } from "@/components/sink-examples";

/** Coverage section: stamps data-component so the check script can verify every catalog component renders here. */
function Section({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <section data-component={name} id={`demo-${name}`} className="scroll-mt-24">
      {children}
    </section>
  );
}

const SHIPMENTS = [
  { id: "#4821", customer: "Maya Chen", items: 12, total: "$1,204.00", status: "Packed" },
  { id: "#4820", customer: "Jonas Weber", items: 4, total: "$316.50", status: "Labeled" },
  { id: "#4819", customer: "Priya Nair", items: 27, total: "$2,940.75", status: "QA hold" },
];

function QuoteToast() {
  const [open, setOpen] = React.useState(false);
  return (
    <ToastProvider>
      <Button onClick={() => setOpen(true)}>Email my quote</Button>
      <Toast open={open} onOpenChange={setOpen} duration={6000}>
        <ToastTitle>Quote sent</ToastTitle>
        <ToastDescription>Your fulfillment quote is on its way to crew@acme.inc.</ToastDescription>
        <ToastClose>Close</ToastClose>
      </Toast>
      <ToastViewport />
    </ToastProvider>
  );
}

export interface DemoTypeStep {
  role: string;
  sizePx: number;
  lineHeight: number;
}

export function EnterpriseDemo({
  vars,
  mode = "light",
  typeSteps = [],
}: {
  vars: Record<string, string>;
  mode?: "light" | "dark";
  typeSteps?: DemoTypeStep[];
}) {
  const [density, setDensity] = React.useState<"sm" | "default" | "lg">("default");

  const colorTokens = Object.entries(vars).filter(([, value]) => value.startsWith("oklch("));
  const chartTokens = colorTokens.filter(([name]) => name.startsWith("--chart-"));
  const surfaceTokens = colorTokens.filter(([name]) => !name.startsWith("--chart-"));
  const radius = vars["--radius"];
  const borderWidth = vars["--border-width"];

  const statusBadge = (status: string) =>
    status === "Packed" ? (
      <Badge data-variant="default">Packed</Badge>
    ) : status === "Labeled" ? (
      <Badge variant="secondary" data-variant="secondary">Labeled</Badge>
    ) : status === "QA hold" ? (
      <Badge variant="destructive" data-variant="destructive">QA hold</Badge>
    ) : status === "Archived" ? (
      <Badge variant="ghost" data-variant="ghost">Archived</Badge>
    ) : (
      <Badge variant="outline" data-variant="outline">{status}</Badge>
    );

  return (
    <div className={mode === "dark" ? "dark" : ""}>
      <div style={vars as React.CSSProperties} className="arche-identity-scope bg-background text-foreground">
        {/* ── Site header ─────────────────────────────── */}
        <BlockPreview name="site-header" />

        {/* ── Hero ────────────────────────────────────── */}
        <BlockPreview name="hero" />
        <div className="mx-auto max-w-6xl px-6">
          <Section name="dialog">
            <div className="flex flex-wrap items-center gap-2 py-4">
              <span className="text-sm text-muted-foreground">See it in your workflow:</span>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" data-size="sm">Quick note (sm)</Button>
                </DialogTrigger>
                <DialogContent size="sm">
                  <DialogTitle>Dock note</DialogTitle>
                  <DialogDescription>Pin a note to bay 3 for the morning crew.</DialogDescription>
                  <DialogClose>Done</DialogClose>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" data-size="default">Book a tour (default)</Button>
                </DialogTrigger>
                <DialogContent size="default">
                  <DialogTitle>Tour the Oakland warehouse</DialogTitle>
                  <DialogDescription>Thirty minutes, packing lines 1–3, carrier cutoff at 17:30.</DialogDescription>
                  <DialogClose>Done</DialogClose>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" data-size="lg">Capacity plan (lg)</Button>
                </DialogTrigger>
                <DialogContent size="lg">
                  <DialogTitle>Q1 capacity plan</DialogTitle>
                  <DialogDescription>Reno absorbs Oakland overflow; hiring opens in March for two packers.</DialogDescription>
                  <DialogClose>Done</DialogClose>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" data-size="full">Network map (full)</Button>
                </DialogTrigger>
                <DialogContent size="full">
                  <DialogTitle>Warehouse network</DialogTitle>
                  <DialogDescription>Every bay, every carrier lane, live on the wall display.</DialogDescription>
                  <DialogClose>Done</DialogClose>
                </DialogContent>
              </Dialog>
            </div>
          </Section>
        </div>

        <div className="mx-auto max-w-6xl px-6">
          <BlockPreview name="logo-cloud" />
        </div>

        <div className="mx-auto max-w-6xl px-6">
          <BlockPreview name="stats-band" />
          <Section name="tooltip">
            <p className="flex items-center gap-1 py-2 text-sm text-muted-foreground">
              Cutoff 17:30 daily
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="About the cutoff" className="rounded-full border-(length:--border-width) border-border px-1.5 text-xs">?</button>
                  </TooltipTrigger>
                  <TooltipContent>214 parcels packed before today&apos;s cutoff</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </p>
          </Section>
        </div>

        {/* ── Services ────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Section name="tabs">
            <h2 className="text-2xl font-bold tracking-tight">One partner, every mile</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">Pick a service — the same crew, the same cutoff, the same tracking.</p>
            <Tabs defaultValue="fulfillment" className="mt-4">
              <TabsList variant="default" data-variant="default">
                <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
                <TabsTrigger value="freight">Freight</TabsTrigger>
                <TabsTrigger value="warehousing">Warehousing</TabsTrigger>
              </TabsList>
              <TabsContent value="fulfillment">Pick, pack, and ship — order #4821 left the dock in 42 minutes.</TabsContent>
              <TabsContent value="freight"> Oakland → Reno nightly, with room for two more pallets.</TabsContent>
              <TabsContent value="warehousing">14,000 sq ft, climate-zoned, audited every quarter.</TabsContent>
            </Tabs>
            <Tabs defaultValue="retail" className="mt-4">
              <TabsList variant="line" data-variant="line">
                <TabsTrigger value="retail">Retail (14)</TabsTrigger>
                <TabsTrigger value="wholesale">Wholesale (3)</TabsTrigger>
              </TabsList>
              <TabsContent value="retail">Direct-to-customer parcels with branded packing slips.</TabsContent>
              <TabsContent value="wholesale">Palletized retail-ready cartons, EDI included.</TabsContent>
            </Tabs>
          </Section>
          <div className="mt-6">
            <BlockPreview name="features" />
          </div>
          <Section name="aspect-ratio">
            <figure className="mt-6">
              <AspectRatio ratio={16 / 9} className="w-full overflow-hidden rounded-xl bg-muted">
                <span className="flex h-full items-center justify-center text-sm text-muted-foreground">Warehouse tour · 16:9 facility film</span>
              </AspectRatio>
              <figcaption className="mt-2 text-sm text-muted-foreground">Packing line 2, Oakland — filmed Tuesday.</figcaption>
            </figure>
          </Section>
        </div>

        {/* ── Get a quote ─────────────────────────────── */}
        <div className="border-y border-border bg-card/40">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Get a quote in a minute</h2>
              <p className="mt-2 text-muted-foreground">Tell us what ships. A real rate lands in your inbox — no sales call.</p>
              <Section name="form">
                <Form onSubmit={(event) => event.preventDefault()} className="mt-4 grid gap-4">
                  <FormField name="email">
                    <FormLabel>Work email</FormLabel>
                    <FormControl type="email" required placeholder="ops@yourstore.com" />
                    <FormMessage match="valueMissing">An email is required so we can send the rate.</FormMessage>
                  </FormField>
                  <Section name="input">
                    <div className="grid gap-2">
                      <Section name="label">
                        <div className="grid gap-1">
                          <Label htmlFor="demo-contact">Contact name</Label>
                          <Input id="demo-contact" defaultValue="Maya Chen" />
                        </div>
                      </Section>
                      <Input controlSize="sm" data-size="sm" aria-label="Small search" placeholder="Small — SKU lookup" defaultValue="482" />
                      <Input controlSize="default" data-size="default" aria-label="Monthly volume" placeholder="Default — parcels per month" defaultValue="1200" />
                      <Input controlSize="lg" data-size="lg" aria-label="Company" placeholder="Large — company name" />
                      <Input aria-label="Email with error" aria-invalid placeholder="Email" defaultValue="!!!!" />
                      <Input aria-label="Disabled while syncing" disabled placeholder="Disabled while syncing" />
                    </div>
                  </Section>
                  <Section name="select">
                    <div className="grid gap-1">
                      <Label htmlFor="demo-warehouse">Home warehouse</Label>
                      <Select>
                        <SelectTrigger id="demo-warehouse" aria-label="Home warehouse">
                          <SelectValue placeholder="Choose a warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oakland">Oakland</SelectItem>
                          <SelectItem value="reno">Reno</SelectItem>
                          <SelectItem value="austin" disabled>Austin (full)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Section>
                  <Section name="radio-group">
                    <RadioGroup defaultValue="standard" aria-label="Service level" className="grid gap-2">
                      <span className="text-sm font-medium">Service level</span>
                      <div className="flex items-center gap-2 text-sm"><RadioGroupItem value="standard" aria-label="Standard, 3 days" /> Standard · 3 days · $4.90</div>
                      <div className="flex items-center gap-2 text-sm"><RadioGroupItem value="express" aria-label="Express, overnight" /> Express · overnight · $18.00</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><RadioGroupItem value="drone" aria-label="Drone, unavailable" disabled /> Drone · not in Reno yet</div>
                    </RadioGroup>
                  </Section>
                  <Section name="slider">
                    <div className="grid gap-2">
                      <p className="text-sm">Average parcel weight — 4 lb</p>
                      <Slider defaultValue={[4]} max={70} step={1}>
                        <SliderTrack><SliderRange /></SliderTrack>
                        <SliderThumb aria-label="Average parcel weight" />
                      </Slider>
                    </div>
                  </Section>
                  <Section name="textarea">
                    <div className="grid gap-2">
                      <Label htmlFor="demo-notes">Anything fragile?</Label>
                      <Textarea id="demo-notes" placeholder="Glassware, double-boxed…" defaultValue="Friday: 214 parcels, zero mislabels." />
                      <Textarea aria-label="Notes with error" aria-invalid placeholder="Notes" defaultValue="!!!!" />
                      <Textarea aria-label="Disabled notes" disabled placeholder="Disabled while syncing" />
                    </div>
                  </Section>
                  <div className="flex flex-wrap gap-2">
                    <Section name="button">
                      <span className="flex flex-wrap items-center gap-2">
                        <Button variant="default" data-variant="default">Get my rate</Button>
                        <Button variant="secondary" data-variant="secondary">Save draft</Button>
                        <Button variant="destructive" data-variant="destructive">Void</Button>
                        <Button variant="outline" data-variant="outline">Preview</Button>
                        <Button variant="ghost" data-variant="ghost">Dismiss</Button>
                        <Button variant="link" data-variant="link">Rate card</Button>
                        <Button disabled>Disabled</Button>
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-2">
                        <Button size="sm" data-size="sm">Small</Button>
                        <Button size="default" data-size="default">Default</Button>
                        <Button size="lg" data-size="lg">Large</Button>
                        <Button size="icon" data-size="icon" aria-label="More quote actions">···</Button>
                      </span>
                    </Section>
                    <Section name="toast">
                      <QuoteToast />
                    </Section>
                  </div>
                  <FormSubmit>Get my rate</FormSubmit>
                </Form>
                <Form onSubmit={(event) => event.preventDefault()} className="mt-4">
                  <FormField name="email">
                    <FormLabel>Error state (forced)</FormLabel>
                    <FormControl type="email" aria-label="Quote email with error" defaultValue="not-an-email" />
                    <FormMessage match="typeMismatch" forceMatch>Enter a valid work email.</FormMessage>
                  </FormField>
                </Form>
              </Section>
            </div>
            <div className="grid content-start gap-4">
              <Section name="card">
                <div className="grid gap-3">
                  {SINK_EXAMPLES.card}
                  <Card>
                    <CardHeader>
                      <CardTitle>Friday capacity</CardTitle>
                      <CardDescription>Oakland warehouse · packing line 2</CardDescription>
                    </CardHeader>
                    <CardContent>214 of 260 parcels packed — 82% before the carrier cutoff.</CardContent>
                    <CardFooter>
                      <Button size="sm">Open line 3</Button>
                    </CardFooter>
                  </Card>
                </div>
              </Section>
              <Section name="progress">
                <Card>
                  <CardHeader>
                    <CardTitle>Today&apos;s pack progress</CardTitle>
                    <CardDescription>60% before the 17:30 cutoff</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={60} aria-label="Pack progress"><ProgressIndicator style={{ width: "60%" }} /></Progress>
                  </CardContent>
                </Card>
              </Section>
              <Section name="skeleton">
                <Card aria-label="Loading live rate">
                  <CardHeader>
                    <CardTitle>Live rate</CardTitle>
                    <CardDescription>Refreshing from the carrier board…</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              </Section>
            </div>
          </div>
        </div>

        {/* ── Customer portal ─────────────────────────── */}
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h2 className="text-2xl font-bold tracking-tight">Your shipments, live</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Every customer gets this portal: the same components, their own freight. Right-click a row to reassign it.
          </p>
          <Section name="navigation-menu">
            <NavigationMenu className="mt-4">
              <NavigationMenuList>
                <NavigationMenuItem><NavigationMenuLink href="#demo-table">Shipments</NavigationMenuLink></NavigationMenuItem>
                <NavigationMenuItem><NavigationMenuLink href="#demo-activity-feed">Activity</NavigationMenuLink></NavigationMenuItem>
                <NavigationMenuItem><NavigationMenuLink href="#demo-settings">Preferences</NavigationMenuLink></NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </Section>

          <div className="mt-4 grid gap-4">
            <BlockPreview name="dashboard-home" />
            <BlockPreview name="stats-row" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Section name="menubar">
              <Menubar>
                <MenubarMenu>
                  <MenubarTrigger>Shipments</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem>New shipment</MenubarItem>
                    <MenubarItem>Duplicate #4821</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>Archive finished</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger>Warehouse</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem>Shift roster</MenubarItem>
                    <MenubarItem>Bay map…</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </Section>
            <Section name="toggle-group">
              <ToggleGroup type="single" defaultValue={density} onValueChange={(v) => { if (v === "sm" || v === "default" || v === "lg") setDensity(v); }} aria-label="Table density">
                <ToggleGroupItem value="sm">Compact</ToggleGroupItem>
                <ToggleGroupItem value="default">Regular</ToggleGroupItem>
                <ToggleGroupItem value="lg">Roomy</ToggleGroupItem>
              </ToggleGroup>
            </Section>
            <Section name="dropdown-menu">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline">Order actions</Button></DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Print packing slip</DropdownMenuItem>
                  <DropdownMenuItem>Message customer</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Void order</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Section>
          </div>

          <Section name="table">
            <div className="mt-4 grid gap-4">
              {["sm", "default", "lg"].map((d) => (
                <div key={d} className={d === density ? "" : "hidden"}>
                  <p className="mb-1 text-sm font-medium">{d === "sm" ? "Compact (density sm)" : d === "default" ? "Regular (density default)" : "Roomy (density lg)"}</p>
                  {/* literal density tables — one per axis value, the switcher above shows the active one */}
                  {d === "sm" ? (
                    <Table density="sm" data-density="sm">
                      <TableHeader>
                        <TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {SHIPMENTS.map((o) => (
                          <TableRow key={`sm-${o.id}`}><TableCell>{o.id}</TableCell><TableCell>{o.customer}</TableCell><TableCell>{o.items}</TableCell><TableCell>{o.total}</TableCell><TableCell>{statusBadge(o.status)}</TableCell></TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow><TableCell colSpan={3}>3 orders</TableCell><TableCell colSpan={2}>$4,461.25</TableCell></TableRow>
                      </TableFooter>
                    </Table>
                  ) : d === "default" ? (
                    <Table density="default" data-density="default">
                      <TableHeader>
                        <TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {SHIPMENTS.map((o) => (
                          <TableRow key={`default-${o.id}`}><TableCell>{o.id}</TableCell><TableCell>{o.customer}</TableCell><TableCell>{o.items}</TableCell><TableCell>{o.total}</TableCell><TableCell>{statusBadge(o.status)}</TableCell></TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow><TableCell colSpan={3}>3 orders</TableCell><TableCell colSpan={2}>$4,461.25</TableCell></TableRow>
                      </TableFooter>
                    </Table>
                  ) : (
                    <Table density="lg" data-density="lg">
                      <TableHeader>
                        <TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {SHIPMENTS.map((o) => (
                          <TableRow key={`lg-${o.id}`}><TableCell>{o.id}</TableCell><TableCell>{o.customer}</TableCell><TableCell>{o.items}</TableCell><TableCell>{o.total}</TableCell><TableCell>{statusBadge(o.status)}</TableCell></TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow><TableCell colSpan={3}>3 orders</TableCell><TableCell colSpan={2}>$4,461.25</TableCell></TableRow>
                      </TableFooter>
                    </Table>
                  )}
                </div>
              ))}
            </div>
          </Section>
          <Section name="context-menu">
            <p className="mt-2 text-sm text-muted-foreground">Right-click the shipments table above to reassign a row.</p>
            <ContextMenu>
              <ContextMenuTrigger className="block max-w-md rounded-md border-(length:--border-width) border-border p-4 text-sm">Right-click order #4821 to reassign it</ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem>Assign to Maya</ContextMenuItem>
                <ContextMenuItem>Assign to Jonas</ContextMenuItem>
                <ContextMenuItem>Move to QA hold</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </Section>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Section name="badge">
              <span className="flex flex-wrap items-center gap-2">
                <Badge data-variant="default">Packed</Badge>
                <Badge variant="secondary" data-variant="secondary">Labeled</Badge>
                <Badge variant="destructive" data-variant="destructive">QA hold</Badge>
                <Badge variant="outline" data-variant="outline">#4821</Badge>
                <Badge variant="ghost" data-variant="ghost">Archived</Badge>
                <Badge variant="link" data-variant="link">Track →</Badge>
              </span>
            </Section>
            <Section name="alert-dialog">
              <span className="flex flex-wrap gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="outline" data-size="sm">Cancel shipment (sm)</Button></AlertDialogTrigger>
                  <AlertDialogContent size="sm">
                    <AlertDialogTitle>Cancel shipment #4821?</AlertDialogTitle>
                    <AlertDialogDescription>Labels are voided; the customer is notified.</AlertDialogDescription>
                    <AlertDialogCancel>Keep</AlertDialogCancel>
                    <AlertDialogAction>Cancel shipment</AlertDialogAction>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="outline" data-size="default">Archive route (default)</Button></AlertDialogTrigger>
                  <AlertDialogContent size="default">
                    <AlertDialogTitle>Archive “Holiday rush”?</AlertDialogTitle>
                    <AlertDialogDescription>Archived routes stay searchable but leave the board.</AlertDialogDescription>
                    <AlertDialogCancel>Keep</AlertDialogCancel>
                    <AlertDialogAction>Archive</AlertDialogAction>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="destructive" data-size="lg">Close warehouse (lg)</Button></AlertDialogTrigger>
                  <AlertDialogContent size="lg">
                    <AlertDialogTitle>Close the Oakland warehouse?</AlertDialogTitle>
                    <AlertDialogDescription>Open orders reroute to Reno. Staff are reassigned, never released, per the ops agreement.</AlertDialogDescription>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Close warehouse</AlertDialogAction>
                  </AlertDialogContent>
                </AlertDialog>
              </span>
            </Section>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Section name="scroll-area">
              <Card>
                <CardHeader>
                  <CardTitle>Tracking timeline</CardTitle>
                  <CardDescription>Order #4821, oldest first</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-32 w-full">
                    <ScrollAreaViewport>
                      <ol className="flex flex-col gap-1 p-2 text-sm">
                        {SHIPMENTS.concat(SHIPMENTS).map((o, i) => <li key={i}>{o.id} · {o.customer} · {o.total}</li>)}
                      </ol>
                    </ScrollAreaViewport>
                    <ScrollBar orientation="vertical"><ScrollAreaThumb /></ScrollBar>
                  </ScrollArea>
                </CardContent>
              </Card>
            </Section>
            <div className="grid content-start gap-4">
              <BlockPreview name="activity-feed" />
              <BlockPreview name="empty-state" />
            </div>
          </div>

          <div id="demo-settings" className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Notification preferences</CardTitle>
                <CardDescription>What the crew hears about, and how.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Section name="switch">
                  <div className="flex flex-col gap-2 text-sm">
                    <label className="flex items-center gap-2"><Switch aria-label="Notify on ship" /> Notify on ship</label>
                    <label className="flex items-center gap-2"><Switch aria-label="Auto reorder tape" defaultChecked /> Auto reorder tape</label>
                    <label className="flex items-center gap-2 text-muted-foreground"><Switch aria-label="Weekend shifts" disabled /> Weekend shifts</label>
                  </div>
                </Section>
                <Section name="checkbox">
                  <div className="flex flex-col gap-2 text-sm">
                    <label className="flex items-center gap-2"><Checkbox size="sm" data-size="sm" aria-label="Recycled mailer" defaultChecked /> Recycled mailer (sm)</label>
                    <label className="flex items-center gap-2"><Checkbox size="default" data-size="default" aria-label="Double-boxed" /> Double-boxed (default)</label>
                    <label className="flex items-center gap-2"><Checkbox size="lg" data-size="lg" aria-label="Gift wrap" /> Gift wrap (lg)</label>
                    <label className="flex items-center gap-2 text-muted-foreground"><Checkbox aria-label="Locked option" disabled /> Locked by plan</label>
                  </div>
                </Section>
                <Section name="toggle">
                  <div className="flex flex-wrap items-center gap-2">
                    <Toggle variant="default" size="sm" data-variant="default" data-size="sm" aria-label="Small toggle">Small</Toggle>
                    <Toggle variant="default" size="default" data-variant="default" data-size="default" aria-label="Default toggle" defaultPressed>Default</Toggle>
                    <Toggle variant="default" size="lg" data-variant="default" data-size="lg" aria-label="Large toggle">Large</Toggle>
                    <Toggle variant="outline" size="default" data-variant="outline" data-size="default" aria-label="Outline toggle">Outline</Toggle>
                    <Toggle variant="outline" size="sm" data-variant="outline" data-size="sm" aria-label="Small outline toggle">Small outline</Toggle>
                    <Toggle variant="outline" size="lg" data-variant="outline" data-size="lg" aria-label="Large outline toggle">Large outline</Toggle>
                    <Toggle aria-label="Disabled toggle" disabled>Disabled</Toggle>
                  </div>
                </Section>
              </CardContent>
            </Card>
            <div className="grid content-start gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Crew sign-in security</CardTitle>
                  <CardDescription>Two-factor dock code plus password hygiene.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Section name="one-time-password-field">
                    <div className="grid gap-1">
                      <p className="text-sm font-medium">Enter the 4-digit dock code</p>
                      {SINK_EXAMPLES["one-time-password-field"]}
                    </div>
                  </Section>
                  <Section name="password-toggle-field">
                    {SINK_EXAMPLES["password-toggle-field"]}
                  </Section>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Broadcast to the crew</CardTitle>
                  <CardDescription>One announcement, every wall display.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Section name="toolbar">
                    <Toolbar aria-label="Formatting">
                      <ToolbarButton>Bold</ToolbarButton>
                      <ToolbarButton>Italic</ToolbarButton>
                      <ToolbarSeparator />
                      <ToolbarToggleGroup type="single" aria-label="Align" defaultValue="left">
                        <ToolbarToggleItem value="left">Left</ToolbarToggleItem>
                        <ToolbarToggleItem value="center">Center</ToolbarToggleItem>
                      </ToolbarToggleGroup>
                    </Toolbar>
                  </Section>
                  <Section name="collapsible">
                    <Collapsible>
                      <CollapsibleTrigger asChild><Button variant="outline">This week: 3 milestones done</Button></CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 text-sm text-muted-foreground">Packed #4819, labeled #4820, QA passed #4821.</CollapsibleContent>
                    </Collapsible>
                  </Section>
                  <Section name="separator">
                    <div className="grid gap-3">
                      <p className="text-sm">Above the notice</p>
                      <Separator decorative orientation="horizontal" />
                      <p className="text-sm">Below the notice</p>
                    </div>
                  </Section>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* ── Crew ────────────────────────────────────── */}
        <div className="border-y border-border bg-card/40">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <h2 className="text-2xl font-bold tracking-tight">The crew behind your cutoff</h2>
            <p className="mt-2 text-muted-foreground">Line leads, reachable. Hover a name for the shift card.</p>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <Section name="avatar">
                <span className="flex items-center gap-3">
                  <Avatar size="sm" data-size="sm"><AvatarFallback>MC</AvatarFallback></Avatar>
                  <Avatar size="default" data-size="default"><AvatarFallback>JW</AvatarFallback></Avatar>
                  <Avatar size="lg" data-size="lg"><AvatarFallback>PN</AvatarFallback></Avatar>
                </span>
              </Section>
              <Section name="hover-card">
                <p className="text-sm">
                  Line lead{" "}
                  <HoverCard>
                    <HoverCardTrigger asChild><a href="#demo-crew" className="text-primary underline-offset-4 hover:underline">Maya Chen</a></HoverCardTrigger>
                    <HoverCardContent>Warehouse lead · 14 open tasks · on shift till 18:00</HoverCardContent>
                  </HoverCard>{" "}
                  signed off the QA batch;{" "}
                  <HoverCard>
                    <HoverCardTrigger asChild><a href="#demo-crew" className="text-primary underline-offset-4 hover:underline">Jonas Weber</a></HoverCardTrigger>
                    <HoverCardContent>Freight coordinator · Reno lane · on shift till 17:00</HoverCardContent>
                  </HoverCard>{" "}
                  owns the Reno lane.
                </p>
              </Section>
            </div>
          </div>
        </div>

        {/* ── Social proof + pricing ──────────────────── */}
        <div className="mx-auto max-w-6xl px-6 py-10">
          <BlockPreview name="testimonials" />
          <div className="mt-8">
            <BlockPreview name="pricing" />
            <Section name="popover">
              <p className="mt-2 text-sm text-muted-foreground">
                Oversize rules apply.{" "}
                <Popover>
                  <PopoverTrigger asChild><button type="button" className="underline underline-offset-4">What counts as oversize?</button></PopoverTrigger>
                  <PopoverContent>Any side over 48″, or girth over 130″ — quoted per parcel.</PopoverContent>
                </Popover>
              </p>
            </Section>
            <Section name="accordion">
              <h3 className="mt-8 text-xl font-bold tracking-tight">Questions, answered</h3>
              <Accordion type="single" defaultValue="cutoff" collapsible className="mt-3">
                <AccordionItem value="cutoff" spacing="sm" data-spacing="sm">
                  <AccordionTrigger>What time is the carrier cutoff? (compact)</AccordionTrigger>
                  <AccordionContent>17:30 daily; parcels scanned by 17:15 make the truck.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="packaging" spacing="default" data-spacing="default">
                  <AccordionTrigger>What packaging do you use? (regular)</AccordionTrigger>
                  <AccordionContent>Recycled mailers by default, double-boxed glassware, gift wrap on request.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="sla" spacing="lg" data-spacing="lg">
                  <AccordionTrigger>Do you offer an enterprise SLA? (roomy)</AccordionTrigger>
                  <AccordionContent>Same-day processing before noon, quarterly audits, a named line lead, and penalties we actually pay.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </Section>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <BlockPreview name="auth-login" />
            <BlockPreview name="auth-signup" />
          </div>
          <div className="mt-8">
            <BlockPreview name="cta" />
            <div className="mt-8">
              <BlockPreview name="newsletter-signup" />
            </div>
          </div>
        </div>

        <BlockPreview name="site-footer" />

        {/* ── Theme ───────────────────────────────────── */}
        <div className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <h2 className="text-lg font-semibold">Cut from the same cloth</h2>
            <p className="mt-1 text-sm text-muted-foreground">Every pixel above resolves to these tokens — this is the identity, rendered.</p>
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Color tokens">
              {surfaceTokens.map(([name, value]) => (
                <span key={name} className="flex items-center gap-1.5 rounded-md border-(length:--border-width) border-border px-2 py-1 text-xs">
                  <span aria-hidden className="size-4 rounded-sm border-(length:--border-width) border-border" style={{ backgroundColor: `var(${name}, ${value})` }} />
                  {name}
                </span>
              ))}
            </div>
            {typeSteps.length > 0 ? (
              <div className="mt-4 grid gap-2" aria-label="Type scale">
                {typeSteps.map((step) => (
                  <p key={step.role} style={{ fontSize: `${step.sizePx}px`, lineHeight: step.lineHeight }}>
                    <span className="mr-2 font-mono text-xs text-muted-foreground">{step.role} · {step.sizePx}px</span>
                    The quick packer ships order {step.sizePx}.
                  </p>
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                radius
                <span aria-hidden className="inline-block size-8 bg-primary" style={{ borderRadius: radius ? `var(--radius, ${radius})` : undefined }} />
                <code>{radius ?? "—"}</code>
              </span>
              <span className="flex items-center gap-2">
                border width
                <span aria-hidden className="inline-block h-8 w-8 border-border" style={{ borderWidth: borderWidth ? `var(--border-width, ${borderWidth})` : undefined, borderStyle: "solid" }} />
                <code>{borderWidth ?? "—"}</code>
              </span>
            </div>
            {chartTokens.length > 0 ? (
              <div className="mt-3 flex gap-1" aria-label="Chart palette">
                {chartTokens.map(([name, value]) => (
                  <span key={name} title={name} aria-label={name} className="h-8 flex-1 first:rounded-l-md last:rounded-r-md" style={{ backgroundColor: `var(${name}, ${value})` }} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
