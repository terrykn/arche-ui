"use client";

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
import { OneTimePasswordField, OneTimePasswordFieldInput, OneTimePasswordFieldHiddenInput } from "@/components/ui/one-time-password-field";
import { PasswordToggleField, PasswordToggleFieldInput, PasswordToggleFieldToggle } from "@/components/ui/password-toggle-field";
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
import { SINK_EXAMPLES } from "@/components/sink-examples";

function Block({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <section data-component={name} id={`sink-${name}`} className="scroll-mt-24 border-b border-border py-5">
      <div className="mb-3 flex items-baseline gap-2">
        <h3 className="text-base font-semibold">{name}</h3>
      </div>
      {children}
    </section>
  );
}

function ToastDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <ToastProvider>
      <Button onClick={() => setOpen(true)}>Show toast</Button>
      <Toast open={open} onOpenChange={setOpen} duration={6000}>
        <ToastTitle>Order #4821 shipped</ToastTitle>
        <ToastDescription>Tracking ACME-4821-FRIDAY left the warehouse.</ToastDescription>
        <ToastClose>Close</ToastClose>
      </Toast>
      <ToastViewport />
    </ToastProvider>
  );
}

const ORDERS = [
  { id: "#4821", customer: "Maya Chen", items: 12, total: "$1,204.00", status: "Packed" },
  { id: "#4820", customer: "Jonas Weber", items: 4, total: "$316.50", status: "Labeled" },
  { id: "#4819", customer: "Priya Nair", items: 27, total: "$2,940.75", status: "QA hold" },
];

/**
 * Full-catalog blocks (Part 2): every manifest axis value rendered at least
 * once, coherent Acme Inc. content, interactive pieces working. Data hooks
 * (data-component + data-variant/data-size/…) back the coverage check.
 */
export const SINK_BLOCKS: Record<string, React.ReactNode> = {
  accordion: (
    <Block name="accordion">
      <Accordion type="single" defaultValue="launch" collapsible>
        <AccordionItem value="launch" spacing="sm" data-spacing="sm">
          <AccordionTrigger>Launch checklist (compact)</AccordionTrigger>
          <AccordionContent>Ship notes, changelog, store assets.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="retro" spacing="default" data-spacing="default">
          <AccordionTrigger>Sprint retro (regular)</AccordionTrigger>
          <AccordionContent>Packing throughput up 12% after the relabel.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="audit" spacing="lg" data-spacing="lg">
          <AccordionTrigger>Quarterly audit (roomy)</AccordionTrigger>
          <AccordionContent>Every order #4800 and up reconciled against the ledger.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </Block>
  ),
  "alert-dialog": (
    <Block name="alert-dialog">
      <div className="flex flex-wrap gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" data-size="sm">Delete draft (sm)</Button>
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogTitle>Delete draft board?</AlertDialogTitle>
            <AlertDialogDescription>This removes the unsaved draft only.</AlertDialogDescription>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" data-size="default">Archive project (default)</Button>
          </AlertDialogTrigger>
          <AlertDialogContent size="default">
            <AlertDialogTitle>Archive “Holiday rush”?</AlertDialogTitle>
            <AlertDialogDescription>Archived projects stay searchable but leave the board.</AlertDialogDescription>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction>Archive</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" data-size="lg">Close warehouse (lg)</Button>
          </AlertDialogTrigger>
          <AlertDialogContent size="lg">
            <AlertDialogTitle>Close the Oakland warehouse?</AlertDialogTitle>
            <AlertDialogDescription>Open orders reroute to Reno. Staff are reassigned, never released, per the ops agreement.</AlertDialogDescription>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Close warehouse</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Block>
  ),
  "aspect-ratio": (
    <Block name="aspect-ratio">
      <AspectRatio ratio={16 / 9} className="w-full max-w-md bg-muted">
        <span className="flex h-full items-center justify-center text-sm text-muted-foreground">Release teaser · 16:9</span>
      </AspectRatio>
    </Block>
  ),
  avatar: (
    <Block name="avatar">
      <div className="flex items-center gap-3">
        <Avatar size="sm" data-size="sm"><AvatarFallback>MC</AvatarFallback></Avatar>
        <Avatar size="default" data-size="default"><AvatarFallback>JW</AvatarFallback></Avatar>
        <Avatar size="lg" data-size="lg"><AvatarFallback>PN</AvatarFallback></Avatar>
        <span className="text-sm text-muted-foreground">Maya, Jonas, Priya — on shift</span>
      </div>
    </Block>
  ),
  badge: (
    <Block name="badge">
      <div className="flex flex-wrap gap-2">
        <Badge data-variant="default">Packed</Badge>
        <Badge variant="secondary" data-variant="secondary">Labeled</Badge>
        <Badge variant="destructive" data-variant="destructive">QA hold</Badge>
        <Badge variant="outline" data-variant="outline">#4821</Badge>
        <Badge variant="ghost" data-variant="ghost">Archived</Badge>
        <Badge variant="link" data-variant="link">Track →</Badge>
      </div>
    </Block>
  ),
  button: (
    <Block name="button">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="default" data-variant="default">Ship order</Button>
          <Button variant="secondary" data-variant="secondary">Print label</Button>
          <Button variant="destructive" data-variant="destructive">Void</Button>
          <Button variant="outline" data-variant="outline">Save draft</Button>
          <Button variant="ghost" data-variant="ghost">Dismiss</Button>
          <Button variant="link" data-variant="link">View invoice</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" data-size="sm">Small</Button>
          <Button size="default" data-size="default">Default</Button>
          <Button size="lg" data-size="lg">Large</Button>
          <Button size="icon" data-size="icon" aria-label="More actions">···</Button>
        </div>
      </div>
    </Block>
  ),
  card: (
    <Block name="card">
      <div className="grid max-w-2xl gap-3">
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
    </Block>
  ),
  checkbox: (
    <Block name="checkbox">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><Checkbox size="sm" data-size="sm" aria-label="Small task" defaultChecked /> Small</label>
        <label className="flex items-center gap-2 text-sm"><Checkbox size="default" data-size="default" aria-label="Regular task" /> Regular</label>
        <label className="flex items-center gap-2 text-sm"><Checkbox size="lg" data-size="lg" aria-label="Large task" /> Large</label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground"><Checkbox aria-label="Locked task" disabled /> Locked</label>
      </div>
    </Block>
  ),
  collapsible: (
    <Block name="collapsible">
      <Collapsible>
        <CollapsibleTrigger asChild><Button variant="outline">This week: 3 orders done</Button></CollapsibleTrigger>
        <CollapsibleContent className="pt-2 text-sm text-muted-foreground">Packed #4819, labeled #4820, QA passed #4821.</CollapsibleContent>
      </Collapsible>
    </Block>
  ),
  "context-menu": (
    <Block name="context-menu">
      <ContextMenu>
        <ContextMenuTrigger className="block max-w-md border-(length:--border-width) p-4 text-sm">Right-click order #4821 to reassign it</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Assign to Maya</ContextMenuItem>
          <ContextMenuItem>Assign to Jonas</ContextMenuItem>
          <ContextMenuItem>Move to QA hold</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Block>
  ),
  dialog: (
    <Block name="dialog">
      <div className="flex flex-wrap gap-2">
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" data-size="sm">Rename board (sm)</Button></DialogTrigger>
          <DialogContent size="sm"><DialogTitle>Rename board</DialogTitle><DialogDescription>Names show on the wall display.</DialogDescription><DialogClose>Done</DialogClose></DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" data-size="default">Invite crew (default)</Button></DialogTrigger>
          <DialogContent size="default"><DialogTitle>Invite to Acme</DialogTitle><DialogDescription>Crew members see every board in this warehouse.</DialogDescription><DialogClose>Done</DialogClose></DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" data-size="lg">Quarterly plan (lg)</Button></DialogTrigger>
          <DialogContent size="lg"><DialogTitle>Q1 capacity plan</DialogTitle><DialogDescription>Reno absorbs Oakland overflow; hiring opens in March for two packers.</DialogDescription><DialogClose>Done</DialogClose></DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" data-size="full">Wall display (full)</Button></DialogTrigger>
          <DialogContent size="full"><DialogTitle>Warehouse wall display</DialogTitle><DialogDescription>Fullscreen board for the packing line monitor.</DialogDescription><DialogClose>Done</DialogClose></DialogContent>
        </Dialog>
      </div>
    </Block>
  ),
  "dropdown-menu": (
    <Block name="dropdown-menu">
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="outline">Order actions</Button></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Print packing slip</DropdownMenuItem>
          <DropdownMenuItem>Message customer</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Void order</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Block>
  ),
  form: (
    <Block name="form">
      <div className="grid max-w-md gap-6">
        <Form onSubmit={(event) => event.preventDefault()}>
          <FormField name="assignee">
            <FormLabel>Assign order #4821</FormLabel>
            <FormControl type="email" required placeholder="crew@acme.inc" />
            <FormMessage match="valueMissing">An email is required to assign.</FormMessage>
          </FormField>
          <FormSubmit>Assign order</FormSubmit>
        </Form>
        <Form onSubmit={(event) => event.preventDefault()}>
          <FormField name="email">
            <FormLabel>Error state (forced)</FormLabel>
            <FormControl type="email" aria-label="Crew email with error" defaultValue="not-an-email" />
            <FormMessage match="typeMismatch" forceMatch>Enter a valid crew email.</FormMessage>
          </FormField>
        </Form>
      </div>
    </Block>
  ),
  "hover-card": (
    <Block name="hover-card">
      <p className="text-sm">Line lead <HoverCard><HoverCardTrigger asChild><a href="#sink-hover-card" className="text-primary underline-offset-4 hover:underline">Maya Chen</a></HoverCardTrigger><HoverCardContent>Warehouse lead · 14 open tasks · on shift till 18:00</HoverCardContent></HoverCard> signed off the QA batch.</p>
    </Block>
  ),
  input: (
    <Block name="input">
      <div className="grid max-w-md gap-2">
        <Input controlSize="sm" data-size="sm" aria-label="Small search" placeholder="Small — search orders" defaultValue="482" />
        <Input controlSize="default" data-size="default" aria-label="Search" placeholder="Default — search orders" defaultValue="4821" />
        <Input controlSize="lg" data-size="lg" aria-label="Large search" placeholder="Large — search orders" />
        <Input aria-label="Search with error" aria-invalid placeholder="Order number" defaultValue="!!!!" />
        <Input aria-label="Disabled search" disabled placeholder="Disabled while syncing" />
      </div>
    </Block>
  ),
  label: (
    <Block name="label">
      <div className="grid max-w-md gap-1">
        <Label htmlFor="sink-task-name">Task name</Label>
        <Input id="sink-task-name" defaultValue="Restock packing tape" />
      </div>
    </Block>
  ),
  menubar: (
    <Block name="menubar">
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Board</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New board</MenubarItem>
            <MenubarItem>Duplicate “Holiday rush”</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Archive finished</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Crew</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Invite…</MenubarItem>
            <MenubarItem>Shift roster</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </Block>
  ),
  "navigation-menu": (
    <Block name="navigation-menu">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem><NavigationMenuLink href="#sink-navigation-menu">Boards</NavigationMenuLink></NavigationMenuItem>
          <NavigationMenuItem><NavigationMenuLink href="#sink-table">Orders</NavigationMenuLink></NavigationMenuItem>
          <NavigationMenuItem><NavigationMenuLink href="#sink-card">Capacity</NavigationMenuLink></NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </Block>
  ),
  "one-time-password-field": (
    <Block name="one-time-password-field">
      <div className="grid gap-1">
        <p className="text-sm font-medium">Enter the 4-digit dock code</p>
        {SINK_EXAMPLES["one-time-password-field"]}
      </div>
    </Block>
  ),
  "password-toggle-field": (
    <Block name="password-toggle-field">{SINK_EXAMPLES["password-toggle-field"]}</Block>
  ),
  popover: (
    <Block name="popover">
      <Popover>
        <PopoverTrigger asChild><Button variant="outline">Shortcuts</Button></PopoverTrigger>
        <PopoverContent>⌘K search · ⌘⏎ submit · ? every shortcut</PopoverContent>
      </Popover>
    </Block>
  ),
  progress: (
    <Block name="progress">
      <div className="grid max-w-md gap-2">
        <p className="text-sm">Friday pack progress — 60%</p>
        <Progress value={60} aria-label="Pack progress"><ProgressIndicator style={{ width: "60%" }} /></Progress>
      </div>
    </Block>
  ),
  "radio-group": (
    <Block name="radio-group">
      <RadioGroup defaultValue="standard" aria-label="Shipping method">
        <div className="flex items-center gap-2 text-sm"><RadioGroupItem value="standard" aria-label="Standard, 3 days" /> Standard · 3 days · $4.90</div>
        <div className="flex items-center gap-2 text-sm"><RadioGroupItem value="express" aria-label="Express, overnight" /> Express · overnight · $18.00</div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><RadioGroupItem value="drone" aria-label="Drone, unavailable" disabled /> Drone · not in Reno yet</div>
      </RadioGroup>
    </Block>
  ),
  "scroll-area": (
    <Block name="scroll-area">
      <ScrollArea className="h-24 w-full max-w-md border-(length:--border-width)">
        <ScrollAreaViewport>
          <ol className="flex flex-col gap-1 p-2 text-sm">
            {ORDERS.concat(ORDERS).map((o, i) => <li key={i}>{o.id} · {o.customer} · {o.total}</li>)}
          </ol>
        </ScrollAreaViewport>
        <ScrollBar orientation="vertical"><ScrollAreaThumb /></ScrollBar>
      </ScrollArea>
    </Block>
  ),
  select: (
    <Block name="select">
      <div className="flex max-w-md gap-2">
        <Select>
          <SelectTrigger aria-label="Order status"><SelectValue placeholder="Set status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="packed">Packed</SelectItem>
            <SelectItem value="labeled">Labeled</SelectItem>
            <SelectItem value="qa" disabled>QA hold (locked)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Block>
  ),
  separator: (
    <Block name="separator">
      <div className="grid gap-3">
        <p className="text-sm">Above the fold</p>
        <Separator decorative orientation="horizontal" />
        <p className="text-sm">Below the fold</p>
        <div className="flex h-8 items-center gap-3 text-sm">
          <span>Oakland</span>
          <Separator decorative orientation="vertical" />
          <span>Reno</span>
        </div>
      </div>
    </Block>
  ),
  skeleton: (
    <Block name="skeleton">
      <div className="grid max-w-md gap-2" aria-label="Loading orders">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </Block>
  ),
  slider: (
    <Block name="slider">
      <div className="grid max-w-md gap-2">
        <p className="text-sm">Carrier cutoff buffer — 40 min</p>
        <Slider defaultValue={[40]} max={120} step={5}>
          <SliderTrack><SliderRange /></SliderTrack>
          <SliderThumb aria-label="Cutoff buffer minutes" />
        </Slider>
      </div>
    </Block>
  ),
  switch: (
    <Block name="switch">
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-2"><Switch aria-label="Notify on ship" /> Notify on ship</label>
        <label className="flex items-center gap-2"><Switch aria-label="Auto reorder" defaultChecked /> Auto reorder tape</label>
        <label className="flex items-center gap-2 text-muted-foreground"><Switch aria-label="Weekend shifts" disabled /> Weekend shifts</label>
      </div>
    </Block>
  ),
  table: (
    <Block name="table">
      <div className="grid gap-4">
        <div>
          <p className="mb-1 text-sm font-medium">Compact (density sm)</p>
          <Table density="sm" data-density="sm">
            <TableHeader>
              <TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {ORDERS.map((o) => (
                <TableRow key={`sm-${o.id}`}><TableCell>{o.id}</TableCell><TableCell>{o.customer}</TableCell><TableCell>{o.items}</TableCell><TableCell>{o.total}</TableCell><TableCell>{o.status}</TableCell></TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow><TableCell colSpan={3}>3 orders</TableCell><TableCell colSpan={2}>$4,461.25</TableCell></TableRow>
            </TableFooter>
          </Table>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium">Regular (density default)</p>
          <Table density="default" data-density="default">
            <TableHeader>
              <TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {ORDERS.map((o) => (
                <TableRow key={`default-${o.id}`}><TableCell>{o.id}</TableCell><TableCell>{o.customer}</TableCell><TableCell>{o.items}</TableCell><TableCell>{o.total}</TableCell><TableCell>{o.status}</TableCell></TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow><TableCell colSpan={3}>3 orders</TableCell><TableCell colSpan={2}>$4,461.25</TableCell></TableRow>
            </TableFooter>
          </Table>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium">Roomy (density lg)</p>
          <Table density="lg" data-density="lg">
            <TableHeader>
              <TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {ORDERS.map((o) => (
                <TableRow key={`lg-${o.id}`}><TableCell>{o.id}</TableCell><TableCell>{o.customer}</TableCell><TableCell>{o.items}</TableCell><TableCell>{o.total}</TableCell><TableCell>{o.status}</TableCell></TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow><TableCell colSpan={3}>3 orders</TableCell><TableCell colSpan={2}>$4,461.25</TableCell></TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </Block>
  ),
  tabs: (
    <Block name="tabs">
      <div className="grid gap-4">
        <Tabs defaultValue="board">
          <TabsList variant="default" data-variant="default">
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>
          <TabsContent value="board">Drag orders between Packed → Labeled → Shipped.</TabsContent>
          <TabsContent value="calendar">Carrier pickups: 14:00 and 17:30 daily.</TabsContent>
          <TabsContent value="files">Packing slips live here after printing.</TabsContent>
        </Tabs>
        <Tabs defaultValue="open">
          <TabsList variant="line" data-variant="line">
            <TabsTrigger value="open">Open (14)</TabsTrigger>
            <TabsTrigger value="done">Done (3)</TabsTrigger>
          </TabsList>
          <TabsContent value="open">#4821 ships today; #4822 awaits labels.</TabsContent>
          <TabsContent value="done">#4819–#4820 closed Friday.</TabsContent>
        </Tabs>
      </div>
    </Block>
  ),
  textarea: (
    <Block name="textarea">
      <div className="grid max-w-md gap-2">
        <Textarea aria-label="Release notes" placeholder="Release notes…" defaultValue="Friday: 214 parcels, zero mislabels." />
        <Textarea aria-label="Notes with error" aria-invalid placeholder="Notes" defaultValue="!!!!" />
        <Textarea aria-label="Disabled notes" disabled placeholder="Disabled while syncing" />
      </div>
    </Block>
  ),
  toast: (
    <Block name="toast">
      <ToastDemo />
    </Block>
  ),
  "toggle-group": (
    <Block name="toggle-group">
      <ToggleGroup type="single" defaultValue="board" aria-label="Board view">
        <ToggleGroupItem value="board">Board</ToggleGroupItem>
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="timeline">Timeline</ToggleGroupItem>
      </ToggleGroup>
    </Block>
  ),
  toggle: (
    <Block name="toggle">
      <div className="flex flex-wrap items-center gap-2">
        <Toggle variant="default" size="sm" data-variant="default" data-size="sm" aria-label="Small toggle">Small</Toggle>
        <Toggle variant="default" size="default" data-variant="default" data-size="default" aria-label="Default toggle" defaultPressed>Default</Toggle>
        <Toggle variant="default" size="lg" data-variant="default" data-size="lg" aria-label="Large toggle">Large</Toggle>
        <Toggle variant="outline" size="default" data-variant="outline" data-size="default" aria-label="Outline toggle">Outline</Toggle>
        <Toggle variant="outline" size="sm" data-variant="outline" data-size="sm" aria-label="Small outline toggle">Small outline</Toggle>
        <Toggle variant="outline" size="lg" data-variant="outline" data-size="lg" aria-label="Large outline toggle">Large outline</Toggle>
        <Toggle aria-label="Disabled toggle" disabled>Disabled</Toggle>
      </div>
    </Block>
  ),
  toolbar: (
    <Block name="toolbar">
      <Toolbar aria-label="Formatting">
        <ToolbarButton>Bold</ToolbarButton>
        <ToolbarButton>Italic</ToolbarButton>
        <ToolbarSeparator />
        <ToolbarToggleGroup type="single" aria-label="Align" defaultValue="left">
          <ToolbarToggleItem value="left">Left</ToolbarToggleItem>
          <ToolbarToggleItem value="center">Center</ToolbarToggleItem>
        </ToolbarToggleGroup>
      </Toolbar>
    </Block>
  ),
  tooltip: (
    <Block name="tooltip">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild><Button variant="outline">Hover for cutoff</Button></TooltipTrigger>
          <TooltipContent>Carrier cutoff 17:30 — 214 parcels ready</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Block>
  ),
};
