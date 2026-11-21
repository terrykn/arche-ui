/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
import type * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
