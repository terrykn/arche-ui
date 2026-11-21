"use client";
import * as React from "react";
import { FileIcon, SearchIcon, XIcon } from "lucide-react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Modal, ModalTrigger, ModalContent, ModalFooter, ModalClose } from "@/components/ui/animated-modal";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { Attachment, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription, AttachmentActions, AttachmentAction } from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxEmpty, ComboboxList, ComboboxItem } from "@/components/ui/combobox";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ConfettiButton } from "@/components/ui/confetti";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { CoolMode } from "@/components/ui/cool-mode";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { FileDrop } from "@/components/ui/file-drop";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { Label } from "@/components/ui/label";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from "@/components/ui/menubar";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { PulsatingButton } from "@/components/ui/pulsating-button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { RippleButton } from "@/components/ui/ripple-button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Slider } from "@/components/ui/slider";
import { StatefulButton } from "@/components/ui/stateful-button";
import { Stepper } from "@/components/ui/stepper";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggler } from "@/components/ui/theme-toggler";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { VanishInput } from "@/components/ui/vanish-input";

const FRUITS = ["Apple", "Banana", "Cherry"];
const THUMBNAIL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'/%3E";

function FieldExample() {
    const id = React.useId();
    return (
        <FieldGroup>
            <Field>
                <FieldLabel htmlFor={id}>Email</FieldLabel>
                <Input id={id} type="email" />
                <FieldDescription>Used for receipts.</FieldDescription>
            </Field>
        </FieldGroup>
    );
}

function ThemeExample() {
    const [dark, setDark] = React.useState(false);
    return <ThemeToggler isDark={dark} onToggle={() => setDark((value) => !value)} />;
}

type Selection = Record<string, unknown>;
const EXAMPLES: Record<string, (selection: Selection) => React.ReactNode> = {
    attachment: () => (
        <Attachment>
            <AttachmentMedia><FileIcon /></AttachmentMedia>
            <AttachmentContent><AttachmentTitle>report.pdf</AttachmentTitle><AttachmentDescription>2.4 MB</AttachmentDescription></AttachmentContent>
            <AttachmentActions><AttachmentAction aria-label="Remove file"><XIcon /></AttachmentAction></AttachmentActions>
        </Attachment>
    ),
    calendar: () => <Calendar mode="single" />,
    checkbox: () => <Checkbox aria-label="Accept terms" defaultChecked />,
    combobox: () => (
        <Combobox items={FRUITS}>
            <ComboboxInput placeholder="Pick a fruit" aria-label="Fruit" />
            <ComboboxContent>
                <ComboboxEmpty>No results.</ComboboxEmpty>
                <ComboboxList>{(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}</ComboboxList>
            </ComboboxContent>
        </Combobox>
    ),
    "date-picker": () => <DatePicker />,
    field: () => <FieldExample />,
    "file-drop": () => <FileDrop />,
    input: () => <Input placeholder="Email" aria-label="Email" />,
    "input-group": () => (
        <InputGroup><InputGroupAddon><SearchIcon /></InputGroupAddon><InputGroupInput placeholder="Search" aria-label="Search" /></InputGroup>
    ),
    "input-otp": () => (
        <InputOTP maxLength={4} aria-label="Verification code">
            <InputOTPGroup>{[0, 1, 2, 3].map((i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
        </InputOTP>
    ),
    label: () => <Label>Label</Label>,
    "native-select": () => (
        <NativeSelect aria-label="Plan"><NativeSelectOption value="free">Free</NativeSelectOption><NativeSelectOption value="pro">Pro</NativeSelectOption></NativeSelect>
    ),
    "radio-group": () => (
        <RadioGroup defaultValue="one" aria-label="Choice"><RadioGroupItem value="one" aria-label="One" /><RadioGroupItem value="two" aria-label="Two" /></RadioGroup>
    ),
    select: () => (
        <Select><SelectTrigger aria-label="Option"><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="one">One</SelectItem><SelectItem value="two">Two</SelectItem></SelectContent></Select>
    ),
    slider: () => <Slider defaultValue={[40]} max={100} aria-label="Volume" className="w-48" />,
    stepper: () => <Stepper steps={["Cart", "Shipping", "Pay"]} current={1} className="isolate w-64" />,
    switch: () => <Switch aria-label="Notifications" defaultChecked />,
    textarea: () => <Textarea aria-label="Message" placeholder="Message" />,
    "vanish-input": () => <VanishInput placeholders={["Search orders", "Search people"]} />,
    button: (selection) => {
        const look = selection as Pick<React.ComponentProps<typeof Button>, "shadow" | "fontWeight">;
        return (
            <div className="flex flex-wrap gap-2">
                {(["default", "secondary", "destructive", "outline", "ghost", "link", "brand"] as const).map((v) => (
                    <Button key={v} variant={v} shadow={look.shadow} fontWeight={look.fontWeight}>{v}</Button>
                ))}
                {(["xs", "sm", "default", "lg"] as const).map((s) => (
                    <Button key={s} size={s} shadow={look.shadow} fontWeight={look.fontWeight}>{s}</Button>
                ))}
            </div>
        );
    },
    "button-group": () => <ButtonGroup><Button variant="secondary">Copy</Button><ButtonGroupSeparator /><Button variant="secondary">Paste</Button></ButtonGroup>,
    confetti: () => <ConfettiButton>Celebrate</ConfettiButton>,
    "cool-mode": () => <CoolMode><Button>Hold me</Button></CoolMode>,
    "interactive-hover-button": () => <InteractiveHoverButton>Get started</InteractiveHoverButton>,
    "magnetic-button": () => <MagneticButton>Hover me</MagneticButton>,
    "pulsating-button": () => <PulsatingButton>Join now</PulsatingButton>,
    "rainbow-button": () => <RainbowButton>Upgrade</RainbowButton>,
    "ripple-button": () => <RippleButton>Press me</RippleButton>,
    "shimmer-button": () => <ShimmerButton>Start free</ShimmerButton>,
    "shiny-button": () => <ShinyButton>New feature</ShinyButton>,
    "stateful-button": () => <StatefulButton onClick={() => new Promise((resolve) => setTimeout(resolve, 1200))}>Save</StatefulButton>,
    "theme-toggler": () => <ThemeExample />,
    toggle: () => <Toggle variant="outline">Bold</Toggle>,
    "toggle-group": () => (
        <ToggleGroup type="single" aria-label="Alignment"><ToggleGroupItem value="left">Left</ToggleGroupItem><ToggleGroupItem value="right">Right</ToggleGroupItem></ToggleGroup>
    ),
    "alert-dialog": () => (
        <AlertDialog>
            <AlertDialogTrigger asChild><Button>Open alert</Button></AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Confirm action</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction>Continue</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    ),
    "animated-modal": () => (
        <Modal><ModalTrigger>Open modal</ModalTrigger><ModalContent title="Invite" description="Add a teammate."><ModalFooter><ModalClose>Done</ModalClose></ModalFooter></ModalContent></Modal>
    ),
    "animated-tooltip": () => <AnimatedTooltip items={[{ name: "Ada Park", role: "Design" }, { name: "Sam Ortiz", role: "Engineering" }]} />,
    command: () => (
        <Command><CommandInput placeholder="Type a command" /><CommandList><CommandEmpty>No results.</CommandEmpty><CommandGroup heading="Actions"><CommandItem>New file</CommandItem><CommandItem>Invite</CommandItem></CommandGroup></CommandList></Command>
    ),
    "context-menu": () => (
        <ContextMenu><ContextMenuTrigger className="block rounded-md border-(length:--border-width) border-dashed p-4">Right click</ContextMenuTrigger><ContextMenuContent><ContextMenuItem>Rename</ContextMenuItem></ContextMenuContent></ContextMenu>
    ),
    dialog: () => (
        <Dialog><DialogTrigger asChild><Button>Open dialog</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Dialog title</DialogTitle><DialogDescription>Dialog description.</DialogDescription></DialogHeader></DialogContent></Dialog>
    ),
    drawer: () => (
        <Drawer>
            <DrawerTrigger asChild><Button>Open drawer</Button></DrawerTrigger>
            <DrawerContent>
                <DrawerHeader><DrawerTitle>Drawer title</DrawerTitle><DrawerDescription>Drawer description.</DrawerDescription></DrawerHeader>
                <DrawerFooter><DrawerClose asChild><Button variant="outline">Close</Button></DrawerClose></DrawerFooter>
            </DrawerContent>
        </Drawer>
    ),
    "dropdown-menu": () => (
        <DropdownMenu><DropdownMenuTrigger asChild><Button>Open menu</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>Profile</DropdownMenuItem><DropdownMenuItem>Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    ),
    "hero-video-dialog": () => <HeroVideoDialog videoSrc="about:blank" thumbnailSrc={THUMBNAIL} className="w-64" />,
    "hover-card": () => <HoverCard><HoverCardTrigger asChild><Button variant="link">@arche</Button></HoverCardTrigger><HoverCardContent>Profile preview</HoverCardContent></HoverCard>,
    menubar: () => <Menubar><MenubarMenu><MenubarTrigger>File</MenubarTrigger><MenubarContent><MenubarItem>Open</MenubarItem></MenubarContent></MenubarMenu></Menubar>,
    popover: () => <Popover><PopoverTrigger asChild><Button>Open popover</Button></PopoverTrigger><PopoverContent>Popover content</PopoverContent></Popover>,
    sheet: () => (
        <Sheet><SheetTrigger asChild><Button>Open sheet</Button></SheetTrigger><SheetContent><SheetHeader><SheetTitle>Sheet title</SheetTitle><SheetDescription>Sheet description.</SheetDescription></SheetHeader></SheetContent></Sheet>
    ),
    tooltip: () => <TooltipProvider><Tooltip><TooltipTrigger asChild><Button>Hover</Button></TooltipTrigger><TooltipContent>Helpful hint</TooltipContent></Tooltip></TooltipProvider>,
};

export const REGISTRY_EXAMPLE_NAMES = Object.keys(EXAMPLES);
export const hasRegistryExample = (name: string) => Object.hasOwn(EXAMPLES, name);
export function RegistryExample({ name, selection = {} }: { name: string; selection?: Selection }) {
    return EXAMPLES[name]?.(selection) ?? null;
}