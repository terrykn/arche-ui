"use client";

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

type Selection = Record<string, unknown>;

/** First defined string among the knob keys (axis name first, then style-surface knob). */
function pick(selection: Selection, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = selection[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

/**
 * Single-component preview for the identity editor. Same Acme sample content
 * as the docs previews, but the editor's knob selection applies as component
 * props — axes first (variant, size, …), style-surface knobs as fallback —
 * so edits show live. Content-part knobs (menus, popover, dialog, …) apply
 * to the opened surface: click the trigger to see them.
 */
export function ComponentPreview({ name, selection }: { name: string; selection: Selection }) {
  const [toastOpen, setToastOpen] = React.useState(false);
  switch (name) {
    case "accordion":
      return (
        <Accordion type="single" collapsible>
          <AccordionItem
            value="one"
            spacing={pick(selection, "spacing") as React.ComponentProps<typeof AccordionItem>["spacing"]}
          >
            <AccordionTrigger>Launch checklist</AccordionTrigger>
            <AccordionContent>Ship notes, changelog, store assets.</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    case "alert-dialog":
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open alert</Button>
          </AlertDialogTrigger>
          <AlertDialogContent
            size={pick(selection, "size") as React.ComponentProps<typeof AlertDialogContent>["size"]}
            radius={pick(selection, "radiusFrom") as React.ComponentProps<typeof AlertDialogContent>["radius"]}
            shadow={pick(selection, "shadow") as React.ComponentProps<typeof AlertDialogContent>["shadow"]}
          >
            <AlertDialogTitle>Delete this board?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );
    case "aspect-ratio":
      return (
        <AspectRatio ratio={16 / 9} className="w-48 bg-muted">
          Release teaser
        </AspectRatio>
      );
    case "avatar":
      return (
        <Avatar size={pick(selection, "size") as React.ComponentProps<typeof Avatar>["size"]}>
          <AvatarFallback>MC</AvatarFallback>
        </Avatar>
      );
    case "badge":
      return (
        <div style={{ display: "flex", gap: 8 }}>
          <Badge variant={pick(selection, "variant", "defaultVariant") as React.ComponentProps<typeof Badge>["variant"]}>
            New
          </Badge>
          <Badge variant="secondary">Beta</Badge>
        </div>
      );
    case "button":
      return (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant={pick(selection, "variant", "defaultVariant") as React.ComponentProps<typeof Button>["variant"]}
            size={pick(selection, "size", "defaultSize") as React.ComponentProps<typeof Button>["size"]}
            shadow={pick(selection, "shadow") as React.ComponentProps<typeof Button>["shadow"]}
            fontWeight={pick(selection, "fontWeight") as React.ComponentProps<typeof Button>["fontWeight"]}
          >
            Ship order
          </Button>
          <Button variant="ghost">Later</Button>
        </div>
      );
    case "card":
      return (
        <Card
          radius={pick(selection, "radiusFrom") as React.ComponentProps<typeof Card>["radius"]}
          shadow={pick(selection, "shadow") as React.ComponentProps<typeof Card>["shadow"]}
        >
          <CardHeader>
            <CardTitle>Order #4821</CardTitle>
          </CardHeader>
          <CardContent>12 tasks · due Friday · owner Maya Chen</CardContent>
        </Card>
      );
    case "checkbox":
      return (
        <Checkbox
          aria-label="Demo checkbox"
          defaultChecked
          size={pick(selection, "size") as React.ComponentProps<typeof Checkbox>["size"]}
          radius={pick(selection, "radiusFrom") as React.ComponentProps<typeof Checkbox>["radius"]}
        />
      );
    case "collapsible":
      return (
        <Collapsible>
          <CollapsibleTrigger>3 done this week</CollapsibleTrigger>
          <CollapsibleContent>Packed #4819, labeled #4820, QA #4821.</CollapsibleContent>
        </Collapsible>
      );
    case "context-menu":
      return (
        <ContextMenu>
          <ContextMenuTrigger className="block border-(length:--border-width) p-4">
            Right-click task “Restock packing tape”
          </ContextMenuTrigger>
          <ContextMenuContent
            radius={pick(selection, "radiusFrom") as React.ComponentProps<typeof ContextMenuContent>["radius"]}
            shadow={pick(selection, "shadow") as React.ComponentProps<typeof ContextMenuContent>["shadow"]}
          >
            <ContextMenuItem>Assign to Jonas</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    case "dialog":
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open dialog</Button>
          </DialogTrigger>
          <DialogContent
            size={pick(selection, "size") as React.ComponentProps<typeof DialogContent>["size"]}
            overlayBackground={pick(selection, "overlayBackground") as React.ComponentProps<typeof DialogContent>["overlayBackground"]}
            overlayOpacity={pick(selection, "overlayOpacity") as React.ComponentProps<typeof DialogContent>["overlayOpacity"]}
            backdropBlur={pick(selection, "backdropBlur") as React.ComponentProps<typeof DialogContent>["backdropBlur"]}
            shadow={pick(selection, "shadow") as React.ComponentProps<typeof DialogContent>["shadow"]}
            border={pick(selection, "border") as React.ComponentProps<typeof DialogContent>["border"]}
            radius={pick(selection, "radiusFrom") as React.ComponentProps<typeof DialogContent>["radius"]}
            motion={pick(selection, "motion") as React.ComponentProps<typeof DialogContent>["motion"]}
          >
            <DialogTitle>Archive project?</DialogTitle>
            <DialogDescription>Archived projects leave the active board but stay searchable.</DialogDescription>
            <DialogClose>Cancel</DialogClose>
          </DialogContent>
        </Dialog>
      );
    case "dropdown-menu":
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            radius={pick(selection, "radiusFrom") as React.ComponentProps<typeof DropdownMenuContent>["radius"]}
            shadow={pick(selection, "shadow") as React.ComponentProps<typeof DropdownMenuContent>["shadow"]}
          >
            <DropdownMenuItem>Assign to Maya</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    case "form":
      return (
        <Form onSubmit={(event) => event.preventDefault()}>
          <FormField name="email">
            <FormLabel>Work email</FormLabel>
            <FormControl type="email" required />
            <FormMessage match="valueMissing">An email is required.</FormMessage>
          </FormField>
          <FormSubmit>Invite to Acme</FormSubmit>
        </Form>
      );
    case "hover-card":
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <a href="#sink-maya">Maya Chen</a>
          </HoverCardTrigger>
          <HoverCardContent
            radius={pick(selection, "radiusFrom") as React.ComponentProps<typeof HoverCardContent>["radius"]}
            shadow={pick(selection, "shadow") as React.ComponentProps<typeof HoverCardContent>["shadow"]}
          >
            Warehouse lead · 14 open tasks
          </HoverCardContent>
        </HoverCard>
      );
    case "input":
      return (
        <Input
          placeholder="Search tasks…"
          aria-label="Demo input"
          controlSize={pick(selection, "controlSize") as React.ComponentProps<typeof Input>["controlSize"]}
          radius={pick(selection, "radiusFrom") as React.ComponentProps<typeof Input>["radius"]}
        />
      );
    case "label":
      return (
        <div className="grid gap-1">
          <Label htmlFor="preview-task">Task name</Label>
          <Input id="preview-task" defaultValue="Restock packing tape" />
        </div>
      );
    case "menubar":
      return (
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent
              radius={pick(selection, "radiusFrom") as React.ComponentProps<typeof MenubarContent>["radius"]}
              shadow={pick(selection, "shadow") as React.ComponentProps<typeof MenubarContent>["shadow"]}
            >
              <MenubarItem>New board</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );
    case "navigation-menu":
      return (
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#sink-boards">Boards</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
    case "one-time-password-field": {
      const radius = pick(selection, "radiusFrom") as React.ComponentProps<typeof OneTimePasswordFieldInput>["radius"];
      return (
        <OneTimePasswordField name="otp" aria-label="Verification code">
          <OneTimePasswordFieldInput radius={radius} />
          <OneTimePasswordFieldInput radius={radius} />
          <OneTimePasswordFieldInput radius={radius} />
          <OneTimePasswordFieldInput radius={radius} />
          <OneTimePasswordFieldHiddenInput />
        </OneTimePasswordField>
      );
    }
    case "password-toggle-field":
      return (
        <PasswordToggleField>
          <PasswordToggleFieldInput
            aria-label="Password"
            radius={pick(selection, "radiusFrom") as React.ComponentProps<typeof PasswordToggleFieldInput>["radius"]}
          />
          <PasswordToggleFieldToggle>Show password</PasswordToggleFieldToggle>
        </PasswordToggleField>
      );
    case "popover":
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button>Open popover</Button>
          </PopoverTrigger>
          <PopoverContent
            radius={pick(selection, "radiusFrom") as React.ComponentProps<typeof PopoverContent>["radius"]}
            shadow={pick(selection, "shadow") as React.ComponentProps<typeof PopoverContent>["shadow"]}
          >
            Keyboard shortcuts: ⌘K search, ⌘⏎ submit.
          </PopoverContent>
        </Popover>
      );
    case "progress":
      return (
        <Progress value={60} aria-label="Demo progress">
          <ProgressIndicator style={{ width: "60%" }} />
        </Progress>
      );
    case "radio-group":
      return (
        <RadioGroup defaultValue="standard" aria-label="Demo shipping">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="standard" aria-label="Standard shipping" /> Standard
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="express" aria-label="Express shipping" /> Express
          </div>
        </RadioGroup>
      );
    case "scroll-area":
      return (
        <ScrollArea className="h-24 w-48">
          <ScrollAreaViewport>
            <div className="h-40">Orders #4801–#4821, oldest first.</div>
          </ScrollAreaViewport>
          <ScrollBar orientation="vertical">
            <ScrollAreaThumb />
          </ScrollBar>
        </ScrollArea>
      );
    case "select":
      return (
        <Select>
          <SelectTrigger aria-label="Demo select">
            <SelectValue placeholder="Pick a status" />
          </SelectTrigger>
          <SelectContent
            radius={pick(selection, "radiusFrom") as React.ComponentProps<typeof SelectContent>["radius"]}
            shadow={pick(selection, "shadow") as React.ComponentProps<typeof SelectContent>["shadow"]}
          >
            <SelectItem value="one">In progress</SelectItem>
          </SelectContent>
        </Select>
      );
    case "separator":
      return <Separator decorative orientation="horizontal" className="w-48" />;
    case "skeleton":
      return (
        <Skeleton
          className="h-8 w-40"
          radius={pick(selection, "radiusFrom") as React.ComponentProps<typeof Skeleton>["radius"]}
        />
      );
    case "slider":
      return (
        <Slider defaultValue={[40]} max={100} step={1} className="w-48">
          <SliderTrack>
            <SliderRange />
          </SliderTrack>
          <SliderThumb aria-label="Demo slider" />
        </Slider>
      );
    case "switch":
      return <Switch aria-label="Demo switch" defaultChecked />;
    case "table":
      return (
        <Table density={pick(selection, "density") as React.ComponentProps<typeof Table>["density"]}>
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
      );
    case "tabs":
      return (
        <Tabs defaultValue="one">
          <TabsList variant={pick(selection, "variant", "defaultVariant") as React.ComponentProps<typeof TabsList>["variant"]}>
            <TabsTrigger value="one">Board</TabsTrigger>
            <TabsTrigger value="two">Calendar</TabsTrigger>
          </TabsList>
          <TabsContent value="one">Board panel</TabsContent>
        </Tabs>
      );
    case "textarea":
      return (
        <Textarea
          aria-label="Demo notes"
          placeholder="Release notes…"
          radius={pick(selection, "radiusFrom") as React.ComponentProps<typeof Textarea>["radius"]}
        />
      );
    case "toast":
      return (
        <ToastProvider>
          <Button onClick={() => setToastOpen(true)}>Show toast</Button>
          <Toast
            open={toastOpen}
            onOpenChange={setToastOpen}
            duration={5000}
            radius={pick(selection, "radiusFrom") as React.ComponentProps<typeof Toast>["radius"]}
            shadow={pick(selection, "shadow") as React.ComponentProps<typeof Toast>["shadow"]}
          >
            <ToastTitle>Order shipped</ToastTitle>
            <ToastDescription>Order #4821 left the warehouse.</ToastDescription>
            <ToastClose>Close</ToastClose>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
    case "toggle":
      return (
        <Toggle
          aria-label="Demo toggle"
          variant={pick(selection, "variant", "defaultVariant") as React.ComponentProps<typeof Toggle>["variant"]}
          size={pick(selection, "size", "defaultSize") as React.ComponentProps<typeof Toggle>["size"]}
        >
          Notify me
        </Toggle>
      );
    case "toggle-group":
      return (
        <ToggleGroup type="single" aria-label="Demo view">
          <ToggleGroupItem value="board">Board</ToggleGroupItem>
          <ToggleGroupItem value="list">List</ToggleGroupItem>
        </ToggleGroup>
      );
    case "toolbar":
      return (
        <Toolbar aria-label="Demo toolbar">
          <ToolbarButton>Bold</ToolbarButton>
        </Toolbar>
      );
    case "tooltip":
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button>Hover me</Button>
            </TooltipTrigger>
            <TooltipContent
              radius={pick(selection, "radiusFrom") as React.ComponentProps<typeof TooltipContent>["radius"]}
            >
              Ships Friday
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    default:
      return null;
  }
}
