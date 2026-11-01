"use client";
import * as React from "react";
import * as Primitive from "@radix-ui/react-scroll-area";
import { cn } from "./lib/utils.js";
function ScrollArea({ className, ...props }: React.ComponentProps<typeof Primitive.Root>) { return <Primitive.Root data-slot="scroll-area" className={cn("relative", className)} {...props} />; }
function ScrollAreaViewport({ className, ...props }: React.ComponentProps<typeof Primitive.Viewport>) { return <Primitive.Viewport data-slot="scroll-area-viewport" className={cn("size-full outline-none focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />; }
function ScrollBar({ className, ...props }: React.ComponentProps<typeof Primitive.Scrollbar>) { return <Primitive.Scrollbar data-slot="scroll-area-scrollbar" className={cn("flex touch-none select-none data-[orientation=horizontal]:h-2 data-[orientation=vertical]:w-2", className)} {...props} />; }
function ScrollAreaThumb({ className, ...props }: React.ComponentProps<typeof Primitive.Thumb>) { return <Primitive.Thumb data-slot="scroll-area-thumb" className={cn("relative flex-1 rounded-full bg-border", className)} {...props} />; }
function ScrollAreaCorner(props: React.ComponentProps<typeof Primitive.Corner>) { return <Primitive.Corner data-slot="scroll-area-corner" {...props} />; }
export { ScrollArea, ScrollAreaViewport, ScrollBar, ScrollAreaThumb, ScrollAreaCorner };
