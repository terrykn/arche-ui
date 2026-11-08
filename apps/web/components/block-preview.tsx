"use client";

import * as React from "react";
import { SiteHeader } from "@/components/blocks/site-header";
import { Hero } from "@/components/blocks/hero";
import { LogoCloud } from "@/components/blocks/logo-cloud";
import { Features } from "@/components/blocks/features";
import { StatsBand } from "@/components/blocks/stats-band";
import { Testimonials } from "@/components/blocks/testimonials";
import { Pricing } from "@/components/blocks/pricing";
import { Faq } from "@/components/blocks/faq";
import { Cta } from "@/components/blocks/cta";
import { NewsletterSignup } from "@/components/blocks/newsletter-signup";
import { SiteFooter } from "@/components/blocks/site-footer";
import { AppShell } from "@/components/blocks/app-shell";
import { DashboardHome } from "@/components/blocks/dashboard-home";
import { StatsRow } from "@/components/blocks/stats-row";
import { DataTablePage } from "@/components/blocks/data-table-page";
import { SettingsPage } from "@/components/blocks/settings-page";
import { ActivityFeed } from "@/components/blocks/activity-feed";
import { EmptyState } from "@/components/blocks/empty-state";
import { AuthLogin } from "@/components/blocks/auth-login";
import { AuthSignup } from "@/components/blocks/auth-signup";

/**
 * Live block preview (Parts 6-7): every v1 block rendered with its default
 * Acme slot fill under the site's active identity. Blocks that require slot
 * props receive representative content here — never inside the templates.
 */
export function BlockPreview({ name }: { name: string }) {
  switch (name) {
    case "site-header":
      return <SiteHeader />;
    case "hero":
      return (
        <Hero
          headline="Pack 214 parcels an hour"
          subhead="Acme's packing lines run on one board: scan, pack, seal, done — same-day cutoff included."
          actions={[
            { label: "Start packing", href: "#get-started" },
            { label: "See pricing", href: "#pricing", variant: "secondary" },
          ]}
        />
      );
    case "logo-cloud":
      return <LogoCloud />;
    case "features":
      return <Features />;
    case "stats-band":
      return <StatsBand />;
    case "testimonials":
      return <Testimonials />;
    case "pricing":
      return <Pricing />;
    case "faq":
      return <Faq />;
    case "cta":
      return <Cta headline="Ready when line 2 is" />;
    case "newsletter-signup":
      return <NewsletterSignup />;
    case "site-footer":
      return <SiteFooter />;
    case "app-shell":
      return (
        <AppShell
          activeItem="Board"
          main={
            <div className="flex flex-col gap-6">
              <DashboardHome />
              <StatsRow />
            </div>
          }
        />
      );
    case "dashboard-home":
      return <DashboardHome />;
    case "stats-row":
      return <StatsRow />;
    case "data-table-page":
      return <DataTablePage />;
    case "settings-page":
      return <SettingsPage />;
    case "activity-feed":
      return <ActivityFeed />;
    case "empty-state":
      return <EmptyState title="No orders yet" body="Create the first order to get line 2 moving." actionLabel="New order" />;
    case "auth-login":
      return <AuthLogin />;
    case "auth-signup":
      return <AuthSignup />;
    default:
      return (
        <p className="text-sm text-muted-foreground">
          Unknown block “{name}”.
        </p>
      );
  }
}
