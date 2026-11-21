/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return <SliderPrimitive.Root data-slot="slider" className={cn("relative flex w-full touch-none select-none items-center data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col", className)} {...props} />;
}
function SliderTrack({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Track>) {
  return <SliderPrimitive.Track data-slot="slider-track" className={cn("relative grow overflow-hidden rounded-full bg-muted data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2", className)} {...props} />;
}
function SliderRange({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Range>) {
  return <SliderPrimitive.Range data-slot="slider-range" className={cn("absolute bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full", className)} {...props} />;
}
function SliderThumb({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Thumb>) {
  return <SliderPrimitive.Thumb data-slot="slider-thumb" className={cn("block size-4 shrink-0 rounded-full border-(length:--border-width) border-ring bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", className)} {...props} />;
}
export { Slider, SliderTrack, SliderRange, SliderThumb };
