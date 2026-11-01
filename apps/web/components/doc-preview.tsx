"use client";

import * as React from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Progress, ProgressIndicator } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider, SliderTrack, SliderRange, SliderThumb } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/** Live preview per doc component id (installed Arche components, default state). */
export function DocPreview({ id }: { id: string }) {
  switch (id) {
    case "button":
      return <div style={{ display: "flex", gap: 8 }}><Button>Primary</Button><Button variant="ghost">Ghost</Button></div>;
    case "card":
      return <Card><CardHeader><CardTitle>Card title</CardTitle></CardHeader><CardContent>Card content</CardContent></Card>;
    case "input":
      return <Input placeholder="Type here…" aria-label="Demo input" />;
    case "dialog":
      return <Dialog><DialogTrigger asChild><Button>Open dialog</Button></DialogTrigger><DialogContent><DialogTitle>Delete this library?</DialogTitle><DialogDescription>This dialog is composed of token slots.</DialogDescription><DialogClose>Cancel</DialogClose></DialogContent></Dialog>;
    case "dropdown-menu":
      return <DropdownMenu><DropdownMenuTrigger asChild><Button>Open menu</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>First</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
    case "select":
      return <Select><SelectTrigger aria-label="Demo select"><SelectValue placeholder="Pick one" /></SelectTrigger><SelectContent><SelectItem value="one">One</SelectItem></SelectContent></Select>;
    case "checkbox":
      return <Checkbox aria-label="Demo checkbox" defaultChecked />;
    case "switch":
      return <Switch aria-label="Demo switch" defaultChecked />;
    case "tabs":
      return <Tabs defaultValue="one"><TabsList><TabsTrigger value="one">One</TabsTrigger><TabsTrigger value="two">Two</TabsTrigger></TabsList><TabsContent value="one">Panel one</TabsContent></Tabs>;
    case "accordion":
      return <Accordion type="single" collapsible><AccordionItem value="one"><AccordionTrigger>Trigger</AccordionTrigger><AccordionContent>Content</AccordionContent></AccordionItem></Accordion>;
    case "tooltip":
      return <TooltipProvider><Tooltip><TooltipTrigger asChild><Button>Hover me</Button></TooltipTrigger><TooltipContent>Tip</TooltipContent></Tooltip></TooltipProvider>;
    case "popover":
      return <Popover><PopoverTrigger asChild><Button>Open popover</Button></PopoverTrigger><PopoverContent>Popover body</PopoverContent></Popover>;
    case "badge":
      return <div style={{ display: "flex", gap: 8 }}><Badge>New</Badge><Badge variant="secondary">Beta</Badge></div>;
    case "avatar":
      return <Avatar><AvatarFallback>JD</AvatarFallback></Avatar>;
    case "slider":
      return <Slider defaultValue={[40]} max={100}><SliderTrack><SliderRange /></SliderTrack><SliderThumb aria-label="Demo slider" /></Slider>;
    case "progress":
      return <Progress value={60} aria-label="Demo progress"><ProgressIndicator style={{ width: "60%" }} /></Progress>;
    case "toast":
      return <ToastProvider><Toast duration={600000}><ToastTitle>Heads up</ToastTitle><ToastDescription>Something happened.</ToastDescription><ToastClose>Close</ToastClose></Toast><ToastViewport /></ToastProvider>;
    case "alert-dialog":
      return <AlertDialog><AlertDialogTrigger asChild><Button>Open alert</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogTitle>Confirm</AlertDialogTitle><AlertDialogDescription>Are you sure?</AlertDialogDescription><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction>Continue</AlertDialogAction></AlertDialogContent></AlertDialog>;
    default:
      return null;
  }
}
