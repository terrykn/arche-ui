/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";
import * as React from "react";
import * as P from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const dropdownMenuContentVariants = cva("z-50 min-w-32 overflow-hidden border-(length:--border-width) bg-popover p-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out", { variants: { radius: { sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" }, shadow: { none: "shadow-none", sm: "shadow-(--shadow-sm)", md: "shadow-(--shadow-md)", lg: "shadow-(--shadow-lg)", xl: "shadow-(--shadow-xl)" } }, defaultVariants: {
      radius: "md",
      shadow: "md",
    } });
function DropdownMenu(props: React.ComponentProps<typeof P.Root>) { return <P.Root data-slot="dropdown-menu" {...props} />; }
function DropdownMenuTrigger(props: React.ComponentProps<typeof P.Trigger>) { return <P.Trigger data-slot="dropdown-menu-trigger" {...props} />; }
function DropdownMenuPortal(props: React.ComponentProps<typeof P.Portal>) { return <P.Portal data-slot="dropdown-menu-portal" {...props} />; }
function DropdownMenuContent({ className, radius, shadow, container, ...props }: React.ComponentProps<typeof P.Content> & VariantProps<typeof dropdownMenuContentVariants> & { container?: HTMLElement | null }) { return <DropdownMenuPortal container={container ?? undefined}><P.Content data-slot="dropdown-menu-content" className={cn(dropdownMenuContentVariants({ radius, shadow }), className)} {...props} /></DropdownMenuPortal>; }
function DropdownMenuGroup(props: React.ComponentProps<typeof P.Group>) { return <P.Group data-slot="dropdown-menu-group" {...props} />; }
function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof P.Item>) { return <P.Item data-slot="dropdown-menu-item" className={cn("relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)} {...props} />; }
function DropdownMenuCheckboxItem({ className, children, ...props }: React.ComponentProps<typeof P.CheckboxItem>) { return <P.CheckboxItem data-slot="dropdown-menu-checkbox-item" className={cn("relative flex items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:opacity-50", className)} {...props}><span className="absolute left-2"><P.ItemIndicator><Check className="size-4" /></P.ItemIndicator></span>{children}</P.CheckboxItem>; }
function DropdownMenuRadioGroup(props: React.ComponentProps<typeof P.RadioGroup>) { return <P.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />; }
function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof P.RadioItem>) { return <P.RadioItem data-slot="dropdown-menu-radio-item" className={cn("relative flex items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:opacity-50", className)} {...props}><span className="absolute left-2"><P.ItemIndicator><Circle className="size-2 fill-current" /></P.ItemIndicator></span>{children}</P.RadioItem>; }
function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof P.Label>) { return <P.Label data-slot="dropdown-menu-label" className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />; }
function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof P.Separator>) { return <P.Separator data-slot="dropdown-menu-separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />; }
function DropdownMenuSub(props: React.ComponentProps<typeof P.Sub>) { return <P.Sub data-slot="dropdown-menu-sub" {...props} />; }
function DropdownMenuSubTrigger({ className, children, ...props }: React.ComponentProps<typeof P.SubTrigger>) { return <P.SubTrigger data-slot="dropdown-menu-sub-trigger" className={cn("flex items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent", className)} {...props}>{children}<ChevronRight className="ml-auto size-4" /></P.SubTrigger>; }
function DropdownMenuSubContent({ className, ...props }: React.ComponentProps<typeof P.SubContent>) { return <P.SubContent data-slot="dropdown-menu-sub-content" className={cn("z-50 min-w-32 rounded-md border-(length:--border-width) bg-popover p-1 text-popover-foreground shadow-(--shadow-md)", className)} {...props} />; }
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, dropdownMenuContentVariants };
