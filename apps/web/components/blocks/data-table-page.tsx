/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PackageOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface DataTableRow {
  order: string;
  customer: string;
  items: string;
  total: string;
  status: "Packed" | "Labeled" | "QA hold" | "Shipped";
}

export interface DataTablePageProps {
  title?: string;
  rows?: DataTableRow[];
  className?: string;
}

const DEFAULT_ROWS: DataTableRow[] = [
  { order: "№4821", customer: "Maya Chen", items: "12", total: "$1,204.00", status: "Packed" },
  { order: "№4820", customer: "Jonas Weber", items: "4", total: "$316.50", status: "Labeled" },
  { order: "№4819", customer: "Priya Nair", items: "9", total: "$2,940.75", status: "QA hold" },
];

const STATUS_VARIANT: Record<DataTableRow["status"], "default" | "secondary" | "destructive" | "outline"> = {
  Packed: "default",
  Labeled: "secondary",
  "QA hold": "destructive",
  Shipped: "outline",
};

function DataTablePage({ title = "Orders", rows = DEFAULT_ROWS, className }: DataTablePageProps) {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(0);
  const filtered = rows.filter((row) => `${row.order} ${row.customer}`.toLowerCase().includes(query.trim().toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 5));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * 5, safePage * 5 + 5);
  return (
    <section data-block="data-table-page" className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <Badge variant="secondary">
          {filtered.length} order{filtered.length === 1 ? "" : "s"}
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="orders-search" className="sr-only">
            Search orders
          </label>
          <Input id="orders-search" placeholder="Search orders" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} className="w-56" />
          <Button>New order</Button>
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-(length:--border-width) border-border px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <PackageOpen size={24} aria-hidden />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-foreground">No orders match</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {query ? `Nothing matches “${query}”. Clear the search or create the order.` : "Create the first order to get the line moving."}
          </p>
          <Button className="mt-2">New order</Button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-(length:--border-width) border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => (
                  <TableRow key={row.order}>
                    <TableCell className="font-medium">{row.order}</TableCell>
                    <TableCell>{row.customer}</TableCell>
                    <TableCell>{row.items}</TableCell>
                    <TableCell>{row.total}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Page {safePage + 1} of {pageCount}
            </span>
            <span className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" disabled={safePage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={safePage >= pageCount - 1} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}>
                Next
              </Button>
            </span>
          </div>
        </>
      )}
    </section>
  );
}

export { DataTablePage };
