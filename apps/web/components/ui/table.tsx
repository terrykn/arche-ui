/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tableVariants = cva("w-full caption-bottom text-sm", {
  variants: { density: { none: "[&_td]:py-0 [&_th]:py-0", sm: "[&_td]:py-1 [&_th]:py-1", default: "[&_td]:py-2 [&_th]:py-2", lg: "[&_td]:py-4 [&_th]:py-4" } },
  defaultVariants: {
      density: "default",
    },
});
function Table({ className, density, ...props }: React.ComponentProps<"table"> & VariantProps<typeof tableVariants>) { return <div data-slot="table-container" className="relative w-full overflow-x-auto"><table data-slot="table" className={cn(tableVariants({ density }), className)} {...props} /></div>; }
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) { return <thead data-slot="table-header" className={cn("[&_tr]:border-b-(length:--border-width)", className)} {...props} />; }
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) { return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />; }
function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) { return <tfoot data-slot="table-footer" className={cn("border-t-(length:--border-width) bg-muted font-medium", className)} {...props} />; }
function TableRow({ className, ...props }: React.ComponentProps<"tr">) { return <tr data-slot="table-row" className={cn("border-b-(length:--border-width) hover:bg-muted", className)} {...props} />; }
function TableHead({ className, ...props }: React.ComponentProps<"th">) { return <th data-slot="table-head" className={cn("px-2 text-left font-medium text-foreground", className)} {...props} />; }
function TableCell({ className, ...props }: React.ComponentProps<"td">) { return <td data-slot="table-cell" className={cn("px-2 align-middle", className)} {...props} />; }
function TableCaption({ className, ...props }: React.ComponentProps<"caption">) { return <caption data-slot="table-caption" className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />; }
export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption, tableVariants };
