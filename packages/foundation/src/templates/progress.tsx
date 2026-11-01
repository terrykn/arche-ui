"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "./lib/utils.js";

function Progress({ className, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return <ProgressPrimitive.Root data-slot="progress" className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)} {...props} />;
}
function ProgressIndicator({ className, ...props }: React.ComponentProps<typeof ProgressPrimitive.Indicator>) {
  return <ProgressPrimitive.Indicator data-slot="progress-indicator" className={cn("h-full bg-primary transition-transform", className)} {...props} />;
}
export { Progress, ProgressIndicator };
