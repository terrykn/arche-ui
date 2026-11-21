/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonialsVariants = cva("mt-8 grid gap-4", {
  variants: {
    layout: {
      grid: "md:grid-cols-3",
      single: "mx-auto max-w-2xl",
    },
  },
  defaultVariants: { layout: "grid" },
});

export interface TestimonialQuote {
  quote: string;
  name: string;
  role: string;
}

export interface TestimonialsProps extends VariantProps<typeof testimonialsVariants> {
  headline?: string;
  quotes?: TestimonialQuote[];
  className?: string;
}

const DEFAULT_QUOTES: TestimonialQuote[] = [
  { quote: "Cutoff used to be a scramble. Now the board tells us the day's shape by 09:00.", name: "Maya Chen", role: "Line lead, Oakland" },
  { quote: "Mislabels went from weekly to never. The slip prints after the match, period.", name: "Jonas Weber", role: "Warehouse manager, Reno" },
  { quote: "We added a second pickup without adding headcount. The numbers just fit.", name: "Priya Nair", role: "Ops director" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

function Testimonials({ headline = "Loved on the packing floor", quotes = DEFAULT_QUOTES, layout, className }: TestimonialsProps) {
  return (
    <section data-block="testimonials" className={cn("mx-auto w-full max-w-6xl py-16", className)}>
      <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{headline}</h2>
      <div className={cn(testimonialsVariants({ layout }))}>
        {quotes.map((item) => (
          <Card key={item.name}>
            <CardContent>
              <blockquote className="text-foreground">“{item.quote}”</blockquote>
            </CardContent>
            <CardFooter>
              <span className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{initials(item.name)}</AvatarFallback>
                </Avatar>
                <span>
                  <span className="block text-sm font-medium text-foreground">{item.name}</span>
                  <span className="block text-sm text-muted-foreground">{item.role}</span>
                </span>
              </span>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}

export { Testimonials, testimonialsVariants };
