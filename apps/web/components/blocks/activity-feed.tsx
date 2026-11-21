/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface ActivityEvent {
  who: string;
  what: string;
  when: string;
  status?: string;
}

export interface ActivityFeedProps {
  title?: string;
  events?: ActivityEvent[];
  className?: string;
}

const DEFAULT_EVENTS: ActivityEvent[] = [
  { who: "Maya Chen", what: "signed off the QA batch", when: "09:41", status: "QA" },
  { who: "Jonas Weber", what: "booked the 17:30 pickup", when: "09:12", status: "Carrier" },
  { who: "Priya Nair", what: "opened order №4822", when: "08:55", status: "Order" },
  { who: "System", what: "reconciled ledger №4800–№4821", when: "08:00", status: "Ledger" },
];

function ActivityFeed({ title = "Activity", events = DEFAULT_EVENTS, className }: ActivityFeedProps) {
  return (
    <section data-block="activity-feed" aria-label={title} className={cn("flex flex-col", className)}>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <ul className="mt-4 flex flex-col">
        {events.map((event, index) => (
          <li key={`${event.who}-${event.when}`}>
            {index > 0 ? <Separator className="my-3" /> : null}
            <p className="flex items-center gap-3 text-sm">
              <Avatar>
                <AvatarFallback>
                  {event.who
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="font-medium">{event.who}</span> <span className="text-muted-foreground">{event.what}</span>
              </span>
              {event.status ? (
                <Badge variant="secondary" className="ml-auto shrink-0">
                  {event.status}
                </Badge>
              ) : null}
              <span className="shrink-0 text-muted-foreground">{event.when}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export { ActivityFeed };
