import type { CSSProperties } from "react";
import type { DemoIdentity } from "./demo-identities";
import { AppShell } from "./blocks/app-shell";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress, ProgressIndicator } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Plus } from "lucide-react";

/**
 * Homepage story screens — one fitting mini app per rotation prompt,
 * each skinned by its identity. The identity's tokens are mapped onto
 * the component theme variables on the wrapper, so the same primitives
 * (AppShell, Card, Badge, Button, Progress) re-skin per screen.
 * All people, patients, titles and figures are fictional sample data —
 * person refs are initials only, and the dentist "photo" is an
 * initials avatar so nothing identifies a real individual.
 */
export function demoSkin(identity: DemoIdentity) {
  const line = `color-mix(in srgb, ${identity.ink} 14%, transparent)`;
  return {
    "--background": identity.background,
    "--card": identity.surface ?? "#ffffff",
    "--foreground": identity.ink,
    "--card-foreground": identity.ink,
    "--primary": identity.primary,
    "--primary-foreground": identity.onPrimary ?? "#ffffff",
    "--muted": identity.accentBg,
    "--secondary": identity.accentBg,
    "--secondary-foreground": identity.accentText,
    "--accent": identity.accentBg,
    "--accent-foreground": identity.accentText,
    "--muted-foreground": identity.accentText,
    "--border": line,
    "--input": line,
    "--ring": identity.primary,
    "--radius": identity.radius,
    "--border-width": identity.borderWidth,
    background: identity.background,
    color: identity.ink,
    fontFamily: identity.font,
    borderRadius: identity.radius,
    overflow: "hidden",
  } as CSSProperties;
}

/**
 * Identity skin wrapper: maps an identity's tokens onto the component
 * theme variables, so any primitives inside re-skin per identity.
 */
// Dark-mode remap: keeps the identity's brand hues, but swaps the
// surfaces and ink for dark ones so the toggle reads as a true theme.
export function toDark(identity: DemoIdentity): DemoIdentity {
  return {
    ...identity,
    background: "#0c0c11",
    surface: "#16161d",
    ink: "#f5f5f7",
    accentBg: `color-mix(in srgb, ${identity.accentBg} 30%, #16161d)`,
    accentText: `color-mix(in srgb, ${identity.accentText} 55%, #ffffff)`,
  };
}

export function DemoSkin({
  identity,
  children,
  dark,
}: {
  identity: DemoIdentity;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className="transition-[background-color,color] duration-500 motion-reduce:transition-none"
      style={demoSkin(dark ? toDark(identity) : identity)}
    >
      {children}
    </div>
  );
}

function Shell({
  identity,
  brand,
  navItems,
  activeItem,
  userName,
  main,
}: {
  identity: DemoIdentity;
  brand: string;
  navItems: string[];
  activeItem: string;
  userName: string;
  main: React.ReactNode;
}) {
  return (
    <div className="acme-compact" style={demoSkin(identity)}>
      <AppShell
        brand={brand}
        navItems={navItems}
        activeItem={activeItem}
        userName={userName}
        className="min-h-0"
        main={main}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Dental clinic booking — "a deep breath, as an interface"          */
/* Spa-soft: mist background, pill buttons, 20px cards, green means    */
/* good news, plain prices, gentle three-step booking.                */
/* ------------------------------------------------------------------ */

const DENTAL_GREEN = "#2e9e6b";

function DentalBooking({ identity }: { identity: DemoIdentity }) {
  const steps = ["Choose care", "Pick a time", "Confirm"];
  const slots = [
    { time: "9:00", open: true },
    { time: "9:45", open: true },
    { time: "10:30", open: false },
    { time: "11:15", open: true },
  ];
  const picked = "9:45";
  return (
    <Shell
      identity={identity}
      brand="Clearwater"
      navItems={["Book", "Visits", "Family"]}
      activeItem="Book"
      userName="Maya R."
      main={
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xl font-bold tracking-tight">Good morning, Maya,</p>
            <p className="text-xs opacity-60">Let&apos;s keep that smile on schedule.</p>
          </div>
          <Card
            style={{
              borderRadius: identity.radius,
              boxShadow: "0 16px 36px -20px rgba(47, 109, 163, 0.45)",
            }}
            className="gap-3 border-border py-4"
          >
            <CardHeader className="px-4">
              <CardTitle className="text-sm">Next visit</CardTitle>
              <CardDescription>Tue 9:00 · Cleaning · Chair 2</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-4">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback>AO</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-[13px] font-bold">Dr. A. Osei</p>
                  <p className="text-xs opacity-60">Your dentist</p>
                </div>
                <Badge
                  variant="outline"
                  style={{ color: DENTAL_GREEN, borderColor: DENTAL_GREEN }}
                >
                  Confirmed
                </Badge>
              </div>
              <p className="text-xs opacity-70">Cleaning — $89, no surprises.</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" style={{ borderRadius: identity.buttonRadius }}>
                  <Plus size={14} aria-hidden="true" /> Confirm visit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  style={{ borderRadius: identity.buttonRadius }}
                >
                  Reschedule
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-1.5">
            {steps.map((step, i) => (
              <span
                key={step}
                className="flex-1 px-2 py-1.5 text-center text-[11px] font-semibold"
                style={{
                  borderRadius: identity.buttonRadius,
                  background: i === 1 ? identity.primary : identity.accentBg,
                  color: i === 1 ? (identity.onPrimary ?? "#ffffff") : identity.accentText,
                }}
              >
                {i + 1} · {step}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {slots.map((slot) => {
              const selected = slot.time === picked;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.open}
                  aria-pressed={selected}
                  className="flex items-center justify-center gap-1.5 px-2 py-2.5 font-mono text-[13px] disabled:opacity-40"
                  style={{
                    borderRadius: "14px",
                    border: `1px solid ${selected ? DENTAL_GREEN : `color-mix(in srgb, ${identity.ink} 14%, transparent)`}`,
                    background: selected
                      ? `color-mix(in srgb, ${DENTAL_GREEN} 12%, transparent)`
                      : "transparent",
                    color: "inherit",
                    cursor: slot.open ? "pointer" : "not-allowed",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 999,
                      background: slot.open ? DENTAL_GREEN : "currentColor",
                      opacity: slot.open ? 1 : 0.4,
                    }}
                  />
                  {slot.time}
                </button>
              );
            })}
          </div>
        </div>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* 2. Retro game shop — "a Game Boy you can shop in"                   */
/* Collector's cabinet: dot-matrix textures, scanlines, cartridge     */
/* cards, battery-meter stock, magenta prices, chunky toggles.         */
/* ------------------------------------------------------------------ */

const PIXEL_GREEN = "#35e065";
const PIXEL_PINK = "#ff3d71";

function BatteryMeter({ level, label }: { level: number; label: string }) {
  const cells = [0, 1, 2, 3, 4];
  const filled = Math.round((level / 100) * cells.length);
  return (
    <span
      role="img"
      aria-label={label}
      className="inline-flex items-center gap-[3px]"
      style={{
        border: "1px solid currentColor",
        borderRadius: 3,
        padding: "2px 3px",
        opacity: 0.95,
      }}
    >
      {cells.map((cell) => (
        <span
          key={cell}
          aria-hidden="true"
          style={{
            width: 8,
            height: 5,
            borderRadius: 1,
            background: cell < filled ? PIXEL_GREEN : "transparent",
            boxShadow: cell < filled ? `0 0 4px ${PIXEL_GREEN}` : undefined,
            border: "1px solid currentColor",
            opacity: cell < filled ? 1 : 0.35,
          }}
        />
      ))}
    </span>
  );
}

function PixelShop({ identity }: { identity: DemoIdentity }) {
  const ink = identity.ink;
  const filters = ["GB", "GBC", "GBA", "MODDED"];
  const activeFilter = "GBC";
  const items = [
    { title: "Star Courier DX", grade: "Shell: A− · Screen: Mint", price: "42 cr", stock: 80, tag: "1 of 1" },
    { title: "Moss Knight", grade: "Shell: B+ · Screen: Mint", price: "35 cr", stock: 45, tag: "GRADED" },
  ];
  const ticker = "NEW DROPS FRIDAY 6PM ET · 1 OF 1 SHELLS GO FAST · GRADING ON-SITE · ";
  return (
    <Shell
      identity={identity}
      brand="Pixel Vault"
      navItems={["Catalog", "Orders", "Trade-ins"]}
      activeItem="Catalog"
      userName="Rin K"
      main={
        <div className="flex flex-col gap-3">
          <div
            className="demo-ticker"
            aria-hidden="true"
            style={{
              border: `${identity.borderWidth} solid ${ink}`,
              borderRadius: identity.buttonRadius,
              background: identity.primary,
              color: identity.onPrimary ?? "#241b3a",
              fontFamily: identity.font,
              fontSize: 11,
              padding: "4px 0",
            }}
          >
            <span className="demo-ticker-track">
              <span className="pr-2">{ticker}</span>
              <span className="pr-2">{ticker}</span>
            </span>
          </div>
          <h3
            style={{
              fontFamily: identity.font,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontSize: 21,
              lineHeight: 1.1,
              margin: 0,
              textShadow: `2px 2px 0 ${identity.primary}`,
            }}
          >
            Pocket legends
          </h3>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Console filter">
            {filters.map((filter) => {
              const active = filter === activeFilter;
              return (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={active}
                  className="px-2.5 py-1 font-mono text-[11px] font-bold"
                  style={{
                    borderRadius: identity.buttonRadius,
                    border: `${identity.borderWidth} solid ${ink}`,
                    background: active ? identity.primary : "transparent",
                    color: active ? (identity.onPrimary ?? "#241b3a") : "inherit",
                    boxShadow: active ? `3px 3px 0 ${ink}` : undefined,
                    transform: active ? "translate(-1px, -1px)" : undefined,
                    cursor: "pointer",
                  }}
                >
                  {filter}
                </button>
              );
            })}
          </div>
          {items.map((item) => (
            <div
              key={item.title}
              className="px-3 py-2.5"
              style={{
                borderRadius: identity.radius,
                border: `${identity.borderWidth} solid ${ink}`,
                background: identity.surface ?? "#2e2450",
                boxShadow: `5px 5px 0 rgba(0, 0, 0, 0.45)`,
              }}
            >
              <div
                className="demo-scanlines demo-dots mb-2 px-2 py-2"
                style={{
                  borderRadius: `calc(${identity.radius} - 4px)`,
                  background: identity.accentBg,
                  color: identity.accentText,
                }}
              >
                <p
                  className="font-mono text-[13px] font-bold"
                  style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}
                >
                  {item.title}
                </p>
                <p className="font-mono text-[10px] opacity-80" style={{ margin: "2px 0 0" }}>
                  SUPER POCKET · {item.tag}
                </p>
              </div>
              <p className="font-mono text-[10px] opacity-70" style={{ margin: "0 0 6px" }}>
                {item.grade}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: PIXEL_PINK }}
                >
                  {item.price}
                </span>
                <span className="flex-1" />
                <BatteryMeter level={item.stock} label={`${item.title} stock ${item.stock} percent`} />
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 font-mono text-xs font-bold"
              style={{
                borderRadius: identity.buttonRadius,
                border: `${identity.borderWidth} solid ${ink}`,
                background: identity.primary,
                color: identity.onPrimary ?? "#241b3a",
                boxShadow: `4px 4px 0 ${ink}`,
                cursor: "pointer",
              }}
            >
              ADD TO CART
            </button>
            <Button size="sm" variant="secondary" style={{ borderRadius: identity.buttonRadius }}>
              Make offer
            </Button>
          </div>
        </div>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* 3. Enterprise company — "confidence you can audit"                  */
/* Bloomberg-grade restraint: white space, ink strip with red          */
/* numerals, sharp corners, quiet badges, one red pulse line.          */
/* ------------------------------------------------------------------ */

const MERIDIAN_NAVY = "#0f1e38";
const MERIDIAN_STEEL = "#edf0f4";

function MeridianReview({ identity }: { identity: DemoIdentity }) {
  const stats = [
    { value: "99.99%", label: "uptime" },
    { value: "40", label: "countries" },
    { value: "$2B", label: "processed" },
  ];
  const teams = [
    { team: "Platform", owner: "J.W.", status: "On track" },
    { team: "Billing", owner: "P.L.", status: "Audited" },
    { team: "Support", owner: "D.A.", status: "At risk" },
  ];
  return (
    <Shell
      identity={identity}
      brand="Meridian"
      navItems={["Overview", "Teams", "Audit"]}
      activeItem="Overview"
      userName="J. Whitfield"
      main={
        <div className="flex flex-col gap-3">
          <div>
            <p
              className="font-bold"
              style={{ fontSize: 24, letterSpacing: "-0.02em", lineHeight: 1.05, margin: 0 }}
            >
              Q3, in control.
            </p>
            <p className="text-xs opacity-60" style={{ margin: "4px 0 0" }}>
              Every number below is auditable.
            </p>
          </div>
          <div
            className="px-3 py-2.5"
            style={{ background: MERIDIAN_NAVY, borderRadius: identity.radius }}
          >
            <div className="flex" style={{ gap: 12 }}>
              {stats.map((stat) => (
                <div key={stat.label} className="flex-1">
                  <p
                    className="font-bold tabular-nums"
                    style={{ margin: 0, fontSize: 17, color: identity.primary, lineHeight: 1.1 }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ margin: 0, color: "#9aa3b2", textTransform: "uppercase", letterSpacing: "0.08em" }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <svg
              viewBox="0 0 120 22"
              preserveAspectRatio="none"
              aria-hidden="true"
              style={{ display: "block", width: "100%", height: 20, marginTop: 8 }}
            >
              <polyline
                points="0,12 28,12 36,12 42,3 48,20 54,12 84,12 90,6 120,6"
                fill="none"
                stroke={identity.primary}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                className="demo-pulse-line"
              />
            </svg>
          </div>
          <Card style={{ borderRadius: identity.radius }} className="gap-3 border-border py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-sm">Controls review</CardTitle>
              <CardDescription>14 of 14 controls passing</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-4">
              <Progress value={100} aria-label="Controls passing">
                <ProgressIndicator style={{ width: "100%" }} />
              </Progress>
              <div className="flex flex-col gap-2">
                {teams.map((t) => (
                  <div key={t.team} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[13px]">
                      {t.team} <span className="opacity-60">· {t.owner}</span>
                    </span>
                    <Badge variant={t.status === "On track" ? "default" : "secondary"}>
                      {t.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    border: `${identity.borderWidth} solid ${identity.ink}`,
                    borderRadius: 4,
                    background: MERIDIAN_STEEL,
                    color: identity.ink,
                    letterSpacing: "0.06em",
                  }}
                >
                  SOC 2
                </span>
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    border: `${identity.borderWidth} solid ${identity.ink}`,
                    borderRadius: 4,
                    background: MERIDIAN_STEEL,
                    color: identity.ink,
                    letterSpacing: "0.06em",
                  }}
                >
                  ISO 27001
                </span>
              </div>
              <p className="text-xs opacity-70" style={{ margin: 0 }}>
                “Audit prep went from weeks to days.” — D. Okafor, CFO
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" style={{ borderRadius: identity.buttonRadius }}>
                  Export report
                </Button>
                <Button size="sm" variant="secondary" style={{ borderRadius: identity.buttonRadius }}>
                  Invite auditor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}

export function StoryScreen({ identity }: { identity: DemoIdentity }) {
  switch (identity.name) {
    case "Pixel Vault":
      return <PixelShop identity={identity} />;
    case "Meridian":
      return <MeridianReview identity={identity} />;
    case "Clearwater Dental":
    default:
      return <DentalBooking identity={identity} />;
  }
}
