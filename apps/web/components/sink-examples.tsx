import * as React from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Form, FormField, FormLabel, FormControl, FormMessage, FormSubmit } from "@/components/ui/form";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from "@/components/ui/menubar";
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
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Toggle } from "@/components/ui/toggle";
import { Toolbar, ToolbarButton } from "@/components/ui/toolbar";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/**
 * Single source of default-state examples (Part 2 §3): the docs component
 * pages (DocPreview) and the kitchen sink import these same definitions —
 * never a second hand-written copy. Sample content is coherent Acme Inc.
 * material from the Acme Tasks demo world — no lorem ipsum.
 */
export const SINK_EXAMPLES: Record<string, React.ReactNode> = {
  button: (
    <div style={{ display: "flex", gap: 8 }}>
      <Button>Ship order</Button>
      <Button variant="ghost">Later</Button>
    </div>
  ),
  card: (
    <Card>
      <CardHeader>
        <CardTitle>Order #4821</CardTitle>
      </CardHeader>
      <CardContent>12 tasks · due Friday · owner Maya Chen</CardContent>
    </Card>
  ),
  input: <Input placeholder="Search tasks…" aria-label="Demo input" />,
  dialog: (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Archive project?</DialogTitle>
        <DialogDescription>Archived projects leave the active board but stay searchable.</DialogDescription>
        <DialogClose>Cancel</DialogClose>
      </DialogContent>
    </Dialog>
  ),
  "dropdown-menu": (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Open menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Assign to Maya</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  select: (
    <Select>
      <SelectTrigger aria-label="Demo select">
        <SelectValue placeholder="Pick a status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="one">In progress</SelectItem>
      </SelectContent>
    </Select>
  ),
  checkbox: <Checkbox aria-label="Demo checkbox" defaultChecked />,
  switch: <Switch aria-label="Demo switch" defaultChecked />,
  tabs: (
    <Tabs defaultValue="one">
      <TabsList>
        <TabsTrigger value="one">Board</TabsTrigger>
        <TabsTrigger value="two">Calendar</TabsTrigger>
      </TabsList>
      <TabsContent value="one">Board panel</TabsContent>
    </Tabs>
  ),
  accordion: (
    <Accordion type="single" collapsible>
      <AccordionItem value="one">
        <AccordionTrigger>Launch checklist</AccordionTrigger>
        <AccordionContent>Ship notes, changelog, store assets.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  tooltip: (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button>Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>Ships Friday</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
  popover: (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>Keyboard shortcuts: ⌘K search, ⌘⏎ submit.</PopoverContent>
    </Popover>
  ),
  badge: (
    <div style={{ display: "flex", gap: 8 }}>
      <Badge>New</Badge>
      <Badge variant="secondary">Beta</Badge>
    </div>
  ),
  avatar: (
    <Avatar>
      <AvatarFallback>MC</AvatarFallback>
    </Avatar>
  ),
  slider: (
    <Slider defaultValue={[40]} max={100}>
      <SliderTrack>
        <SliderRange />
      </SliderTrack>
      <SliderThumb aria-label="Demo slider" />
    </Slider>
  ),
  progress: (
    <Progress value={60} aria-label="Demo progress">
      <ProgressIndicator style={{ width: "60%" }} />
    </Progress>
  ),
  toast: (
    <ToastProvider>
      <Toast duration={600000}>
        <ToastTitle>Order shipped</ToastTitle>
        <ToastDescription>Order #4821 left the warehouse.</ToastDescription>
        <ToastClose>Close</ToastClose>
      </Toast>
      <ToastViewport />
    </ToastProvider>
  ),
  "alert-dialog": (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Open alert</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Delete this board?</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction>Delete</AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  ),
  "aspect-ratio": (
    <AspectRatio ratio={16 / 9} className="w-48 bg-muted">
      Release teaser
    </AspectRatio>
  ),
  label: (
    <div className="grid gap-1">
      <Label htmlFor="sink-example-task">Task name</Label>
      <Input id="sink-example-task" defaultValue="Restock packing tape" />
    </div>
  ),
  textarea: <Textarea aria-label="Demo notes" placeholder="Release notes…" />,
  "radio-group": (
    <RadioGroup defaultValue="standard" aria-label="Demo shipping">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="standard" aria-label="Standard shipping" /> Standard
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="express" aria-label="Express shipping" /> Express
      </div>
    </RadioGroup>
  ),
  "toggle-group": (
    <ToggleGroup type="single" aria-label="Demo view">
      <ToggleGroupItem value="board">Board</ToggleGroupItem>
      <ToggleGroupItem value="list">List</ToggleGroupItem>
    </ToggleGroup>
  ),
  toggle: <Toggle aria-label="Demo toggle">Notify me</Toggle>,
  toolbar: (
    <Toolbar aria-label="Demo toolbar">
      <ToolbarButton>Bold</ToolbarButton>
    </Toolbar>
  ),
  menubar: (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>New board</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
  "navigation-menu": (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink href="#sink-boards">Boards</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
  "context-menu": (
    <ContextMenu>
      <ContextMenuTrigger className="block border-(length:--border-width) p-4">
        Right-click task “Restock packing tape”
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Assign to Jonas</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
  "hover-card": (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="#sink-maya">Maya Chen</a>
      </HoverCardTrigger>
      <HoverCardContent>Warehouse lead · 14 open tasks</HoverCardContent>
    </HoverCard>
  ),
  collapsible: (
    <Collapsible>
      <CollapsibleTrigger>3 done this week</CollapsibleTrigger>
      <CollapsibleContent>Packed #4819, labeled #4820, QA #4821.</CollapsibleContent>
    </Collapsible>
  ),
  separator: <Separator decorative orientation="horizontal" />,
  skeleton: <Skeleton className="h-8 w-40" />,
  "scroll-area": (
    <ScrollArea className="h-24 w-48">
      <ScrollAreaViewport>
        <div className="h-40">Orders #4801–#4821, oldest first.</div>
      </ScrollAreaViewport>
      <ScrollBar orientation="vertical">
        <ScrollAreaThumb />
      </ScrollBar>
    </ScrollArea>
  ),
  table: (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>#4821 · 12 tasks</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  form: (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <FormField name="email">
        <FormLabel>Work email</FormLabel>
        <FormControl type="email" required />
        <FormMessage match="valueMissing">An email is required.</FormMessage>
      </FormField>
      <FormSubmit>Invite to Acme</FormSubmit>
    </Form>
  ),
  "one-time-password-field": (
    <OneTimePasswordField name="otp" aria-label="Verification code">
      <OneTimePasswordFieldInput />
      <OneTimePasswordFieldInput />
      <OneTimePasswordFieldInput />
      <OneTimePasswordFieldInput />
      <OneTimePasswordFieldHiddenInput />
    </OneTimePasswordField>
  ),
  "password-toggle-field": (
    <PasswordToggleField>
      <PasswordToggleFieldInput aria-label="Password" />
      <PasswordToggleFieldToggle>Show password</PasswordToggleFieldToggle>
    </PasswordToggleField>
  ),
};
