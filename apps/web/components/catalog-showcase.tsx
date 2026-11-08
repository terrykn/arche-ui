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

function Section({ name, children }: { name: string; children: React.ReactNode }) {
  return <section data-component={name} className="border-b-(length:--border-width) py-4"><h2 className="mb-2 font-semibold">{name}</h2>{children}</section>;
}

/**
 * Full-catalog showcase (Brief #3 §8 public identity page).
 * Rendered in any identity by overriding CSS vars; installed copies carry the
 * site's own knob stamps, so this shows the identity's tokens live.
 */
export function CatalogShowcase({ vars, mode = "light" }: { vars: Record<string, string>; mode?: "light" | "dark" }) {
  return (
    <div className={mode === "dark" ? "dark" : ""}>
      <div style={vars as React.CSSProperties} className="bg-background text-foreground">
        <Section name="Accordion"><Accordion type="single" defaultValue="one" collapsible><AccordionItem value="one"><AccordionTrigger>Accordion trigger</AccordionTrigger><AccordionContent>Accordion content</AccordionContent></AccordionItem></Accordion></Section>
        <Section name="Alert Dialog"><AlertDialog><AlertDialogTrigger asChild><Button>Open alert</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogTitle>Confirm action</AlertDialogTitle><AlertDialogDescription>Confirm the action.</AlertDialogDescription><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction>Continue</AlertDialogAction></AlertDialogContent></AlertDialog></Section>
        <Section name="Aspect Ratio"><AspectRatio ratio={16 / 9} className="w-48 bg-muted">Media</AspectRatio></Section>
        <Section name="Avatar"><Avatar><AvatarFallback>AU</AvatarFallback></Avatar></Section>
        <Section name="Badge"><Badge>Status</Badge></Section>
        <Section name="Button"><div className="flex flex-wrap gap-2">{(["default", "secondary", "destructive", "outline", "ghost", "link"] as const).map(variant=><Button key={variant} variant={variant}>{variant}</Button>)}{(["sm", "default", "lg", "icon"] as const).map(size=><Button key={size} size={size}>{size}</Button>)}</div></Section>
        <Section name="Card"><Card><CardHeader><CardTitle>Card title</CardTitle></CardHeader><CardContent>Card content</CardContent></Card></Section>
        <Section name="Checkbox"><div className="flex gap-4"><Checkbox aria-label="Checkbox default" /><Checkbox aria-label="Checkbox checked" defaultChecked /><Checkbox aria-label="Checkbox disabled" disabled /></div></Section>
        <Section name="Collapsible"><Collapsible><CollapsibleTrigger>Show content</CollapsibleTrigger><CollapsibleContent>Collapsible content</CollapsibleContent></Collapsible></Section>
        <Section name="Context Menu"><ContextMenu><ContextMenuTrigger className="block border-(length:--border-width) p-4">Context menu target</ContextMenuTrigger><ContextMenuContent><ContextMenuItem>Context first</ContextMenuItem><ContextMenuItem>Context second</ContextMenuItem></ContextMenuContent></ContextMenu></Section>
        <Section name="Dialog"><Dialog><DialogTrigger asChild><Button>Open dialog</Button></DialogTrigger><DialogContent><DialogTitle>Dialog title</DialogTitle><DialogDescription>Dialog description.</DialogDescription><DialogClose>Close</DialogClose></DialogContent></Dialog></Section>
        <Section name="Dropdown Menu"><DropdownMenu><DropdownMenuTrigger asChild><Button>Open menu</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>Dropdown first</DropdownMenuItem><DropdownMenuItem>Dropdown second</DropdownMenuItem></DropdownMenuContent></DropdownMenu></Section>
        <Section name="Form"><Form onSubmit={event=>event.preventDefault()}><FormField name="email"><FormLabel>Email</FormLabel><FormControl type="email" required /><FormMessage match="valueMissing">Email required</FormMessage></FormField><FormSubmit>Submit</FormSubmit></Form></Section>
        <Section name="Hover Card"><HoverCard><HoverCardTrigger asChild><a href="#hover">Hover card trigger</a></HoverCardTrigger><HoverCardContent>Hover card content</HoverCardContent></HoverCard></Section>
        <Section name="Input"><div className="flex gap-2"><Input aria-label="Input" placeholder="Input" /><Input aria-label="Disabled input" disabled placeholder="Disabled" /></div></Section>
        <Section name="Label"><Label htmlFor="showcase-labeled-input">Label</Label><Input id="showcase-labeled-input" /></Section>
        <Section name="Menubar"><Menubar><MenubarMenu><MenubarTrigger>File</MenubarTrigger><MenubarContent><MenubarItem>Open</MenubarItem></MenubarContent></MenubarMenu></Menubar></Section>
        <Section name="Navigation Menu"><NavigationMenu><NavigationMenuList><NavigationMenuItem><NavigationMenuLink href="#navigation">Navigation link</NavigationMenuLink></NavigationMenuItem></NavigationMenuList></NavigationMenu></Section>
        <Section name="One-Time Password Field"><OneTimePasswordField name="otp" aria-label="Verification code"><OneTimePasswordFieldInput /><OneTimePasswordFieldInput /><OneTimePasswordFieldInput /><OneTimePasswordFieldInput /><OneTimePasswordFieldHiddenInput /></OneTimePasswordField></Section>
        <Section name="Password Toggle Field"><PasswordToggleField><PasswordToggleFieldInput aria-label="Password" /><PasswordToggleFieldToggle>Show password</PasswordToggleFieldToggle></PasswordToggleField></Section>
        <Section name="Popover"><Popover><PopoverTrigger asChild><Button>Open popover</Button></PopoverTrigger><PopoverContent>Popover content</PopoverContent></Popover></Section>
        <Section name="Progress"><Progress value={60} aria-label="Progress"><ProgressIndicator style={{width:"60%"}} /></Progress></Section>
        <Section name="Radio Group"><RadioGroup defaultValue="one" aria-label="Radio group"><div><RadioGroupItem value="one" aria-label="First radio" /> First</div><div><RadioGroupItem value="two" aria-label="Second radio" /> Second</div><RadioGroupItem value="disabled" aria-label="Disabled radio" disabled /></RadioGroup></Section>
        <Section name="Scroll Area"><ScrollArea className="h-24 w-48"><ScrollAreaViewport><div className="h-40">Scrollable content</div></ScrollAreaViewport><ScrollBar orientation="vertical"><ScrollAreaThumb /></ScrollBar></ScrollArea></Section>
        <Section name="Select"><Select><SelectTrigger aria-label="Select option"><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="one">Option one</SelectItem><SelectItem value="two">Option two</SelectItem><SelectItem value="disabled" disabled>Disabled</SelectItem></SelectContent></Select></Section>
        <Section name="Separator"><Separator decorative orientation="horizontal" /></Section>
        <Section name="Skeleton"><Skeleton className="h-8 w-40" /></Section>
        <Section name="Slider"><Slider defaultValue={[40]} max={100} step={1}><SliderTrack><SliderRange /></SliderTrack><SliderThumb aria-label="Slider value" /></Slider></Section>
        <Section name="Switch"><div className="flex gap-4"><Switch aria-label="Switch default" /><Switch aria-label="Switch checked" defaultChecked /><Switch aria-label="Switch disabled" disabled /></div></Section>
        <Section name="Table"><Table><TableHeader><TableRow><TableHead>Heading</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Value</TableCell></TableRow></TableBody></Table></Section>
        <Section name="Tabs"><Tabs defaultValue="one"><TabsList><TabsTrigger value="one">Tab one</TabsTrigger><TabsTrigger value="two">Tab two</TabsTrigger></TabsList><TabsContent value="one">Panel one</TabsContent><TabsContent value="two">Panel two</TabsContent></Tabs></Section>
        <Section name="Textarea"><Textarea aria-label="Textarea" placeholder="Textarea" /><Textarea aria-label="Disabled textarea" disabled /></Section>
        <Section name="Toast"><ToastProvider><Toast duration={600000}><ToastTitle>Toast title</ToastTitle><ToastDescription>Toast description</ToastDescription><ToastClose>Close</ToastClose></Toast><ToastViewport /></ToastProvider></Section>
        <Section name="Toggle"><Toggle aria-label="Toggle">Toggle</Toggle><Toggle aria-label="Disabled toggle" disabled>Disabled</Toggle></Section>
        <Section name="Toggle Group"><ToggleGroup type="single" aria-label="Toggle group"><ToggleGroupItem value="one">One</ToggleGroupItem><ToggleGroupItem value="two">Two</ToggleGroupItem></ToggleGroup></Section>
        <Section name="Toolbar"><Toolbar aria-label="Toolbar"><ToolbarButton>Toolbar action</ToolbarButton></Toolbar></Section>
        <Section name="Tooltip"><TooltipProvider><Tooltip><TooltipTrigger asChild><Button>Tooltip trigger</Button></TooltipTrigger><TooltipContent>Tooltip content</TooltipContent></Tooltip></TooltipProvider></Section>
      </div>
    </div>
  );
}
