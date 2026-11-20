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
import type { HeroProps } from "@/components/blocks/hero";
import type { FeaturesProps } from "@/components/blocks/features";
import type { TestimonialsProps } from "@/components/blocks/testimonials";
import type { PricingProps } from "@/components/blocks/pricing";
import type { CtaProps } from "@/components/blocks/cta";
import type { AppShellProps } from "@/components/blocks/app-shell";
import type { StatsRowProps } from "@/components/blocks/stats-row";
import type { LogoCloudProps } from "@/components/blocks/logo-cloud";
import type { StatsBandProps } from "@/components/blocks/stats-band";
import type { FaqProps } from "@/components/blocks/faq";
import type { NewsletterSignupProps } from "@/components/blocks/newsletter-signup";
import type { SiteFooterProps } from "@/components/blocks/site-footer";
import type { AuthLoginProps } from "@/components/blocks/auth-login";
import type { AuthSignupProps } from "@/components/blocks/auth-signup";
import { PreviewPortalContext } from "@/components/preview-portal";

/**
 * Live block preview (Parts 6-7): every v1 block rendered with its default
 * Acme slot fill under the site's active identity. Blocks that require slot
 * props receive representative content here — never inside the templates.
 */
export function BlockPreview({ name, axes }: { name: string; axes?: Record<string, string> }) {
  // Overlay content (dropdowns in app-shell / site-header) portals here so
  // library tokens apply; null outside a host falls back to document.body.
  const portalContainer = React.useContext(PreviewPortalContext) ?? undefined;
  switch (name) {
    case "site-header":
      return <SiteHeader portalContainer={portalContainer} />;
    case "hero":
      return (
        <Hero
          headline="Pack 214 parcels an hour"
          subhead="Acme's packing lines run on one board: scan, pack, seal, done — same-day cutoff included."
          actions={[
            { label: "Start packing", href: "#get-started" },
            { label: "See pricing", href: "#pricing", variant: "secondary" },
          ]}
          {...(axes as Pick<HeroProps, "alignment" | "mediaLayout"> | undefined)}
        />
      );
    case "logo-cloud":
      return <LogoCloud {...(axes as Pick<LogoCloudProps, "layout"> | undefined)} />;
    case "features":
      return <Features {...(axes as Pick<FeaturesProps, "layout"> | undefined)} />;
    case "stats-band":
      return <StatsBand {...(axes as Pick<StatsBandProps, "columns"> | undefined)} />;
    case "testimonials":
      return <Testimonials {...(axes as Pick<TestimonialsProps, "layout"> | undefined)} />;
    case "pricing":
      return <Pricing {...(axes as Pick<PricingProps, "tierCount"> | undefined)} />;
    case "faq":
      return <Faq {...(axes as Pick<FaqProps, "layout"> | undefined)} />;
    case "cta":
      return <Cta headline="Ready when line 2 is" {...(axes as Pick<CtaProps, "alignment"> | undefined)} />;
    case "newsletter-signup":
      return <NewsletterSignup {...(axes as Pick<NewsletterSignupProps, "layout"> | undefined)} />;
    case "site-footer":
      return <SiteFooter {...(axes as Pick<SiteFooterProps, "layout"> | undefined)} />;
    case "app-shell":
      return (
        <AppShell
          portalContainer={portalContainer}
          activeItem="Board"
          main={
            <div className="flex flex-col gap-6">
              <DashboardHome />
              <StatsRow />
            </div>
          }
          {...(axes as Pick<AppShellProps, "sidebar"> | undefined)}
        />
      );
    case "dashboard-home":
      return <DashboardHome />;
    case "stats-row":
      return <StatsRow {...(axes as Pick<StatsRowProps, "columns"> | undefined)} />;
    case "data-table-page":
      return <DataTablePage />;
    case "settings-page":
      return <SettingsPage />;
    case "activity-feed":
      return <ActivityFeed />;
    case "empty-state":
      return <EmptyState title="No orders yet" body="Create the first order to get line 2 moving." actionLabel="New order" />;
    case "auth-login":
      return <AuthLogin {...(axes as Pick<AuthLoginProps, "layout"> | undefined)} />;
    case "auth-signup":
      return <AuthSignup {...(axes as Pick<AuthSignupProps, "layout"> | undefined)} />;
    default:
      return (
        <p className="text-sm text-muted-foreground">
          Unknown block “{name}”.
        </p>
      );
  }
}
