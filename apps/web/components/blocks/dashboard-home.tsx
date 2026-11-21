/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress, ProgressIndicator } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export interface DashboardKpi {
  label: string;
  value: string;
  delta: string;
}

export interface DashboardActivity {
  who: string;
  what: string;
  when: string;
}

export interface DashboardHomeProps {
  title?: string;
  kpis?: DashboardKpi[];
  activity?: DashboardActivity[];
  className?: string;
}

const DEFAULT_KPIS: DashboardKpi[] = [
  { label: "Parcels today", value: "214", delta: "+12% vs yesterday" },
  { label: "On-time rate", value: "99.1%", delta: "+0.4 pts" },
  { label: "Open orders", value: "14", delta: "3 ship today" },
];

const DEFAULT_ACTIVITY: DashboardActivity[] = [
  { who: "Maya Chen", what: "signed off the QA batch", when: "09:41" },
  { who: "Jonas Weber", what: "booked the 17:30 pickup", when: "09:12" },
  { who: "Priya Nair", what: "opened order №4822", when: "08:55" },
];

function DashboardHome({ title = "Friday operations", kpis = DEFAULT_KPIS, activity = DEFAULT_ACTIVITY, className }: DashboardHomeProps) {
  return (
    <section data-block="dashboard-home" className={cn("flex flex-col gap-6", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <Badge>Live</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <CardTitle>{kpi.label}</CardTitle>
              <CardDescription>{kpi.delta}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-extrabold tracking-tight">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Friday capacity</CardTitle>
            <CardDescription>214 of 260 parcels packed</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={82} aria-label="Friday capacity, 82 percent">
              <ProgressIndicator />
            </Progress>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latest activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col">
              {activity.map((event, index) => (
                <li key={`${event.who}-${event.when}`}>
                  {index > 0 ? <Separator className="my-3" /> : null}
                  <p className="flex items-center gap-2 text-sm">
                    <Avatar>
                      <AvatarFallback>
                        {event.who
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      <span className="font-medium">{event.who}</span> {event.what}
                    </span>
                    <span className="ml-auto shrink-0 text-muted-foreground">{event.when}</span>
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export { DashboardHome };
