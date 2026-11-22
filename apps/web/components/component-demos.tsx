"use client";

/**
 * Demos for catalog components that have no hand-written example in
 * registry-example / sink-examples / component-preview.
 *
 * Each entry is a lazy import of the synced component plus representative
 * sample content, so the editor grid and docs previews render every catalog
 * entry instead of an empty box. Sample data lives here, never in the
 * components themselves.
 */
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type AnyComponent = React.ComponentType<Record<string, unknown>>;

const SAMPLE_TEXT = "Ship faster with Arche";

const img = (from: string, to: string, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="320" height="200" fill="url(%23g)"/><text x="16" y="180" font-family="sans-serif" font-size="14" fill="white">${label}</text></svg>`,
  )}`;

const IMAGES = [img("#6366f1", "#22d3ee", "One"), img("#f59e0b", "#ef4444", "Two"), img("#10b981", "#3b82f6", "Three"), img("#8b5cf6", "#ec4899", "Four"), img("#0ea5e9", "#14b8a6", "Five")];
const WORDS = ["Design", "Build", "Ship"];
const PEOPLE = [
  { id: 1, name: "Ada Park", designation: "Design", image: img("#6366f1", "#22d3ee", "AP") },
  { id: 2, name: "Sam Ortiz", designation: "Engineering", image: img("#f59e0b", "#ef4444", "SO") },
  { id: 3, name: "Maya Chen", designation: "Product", image: img("#10b981", "#3b82f6", "MC") },
];
const CARDS = [
  { id: 1, title: "Fast by default", description: "Server components and streaming.", icon: "◆" },
  { id: 2, title: "Tokenized", description: "Every surface reads from tokens.", icon: "●" },
  { id: 3, title: "Accessible", description: "AA contrast enforced at compile time.", icon: "▲" },
];
const STEPS = ["Workspace", "Profile", "Invite", "Publish"];

/** Lazy demo: imports the module, picks its component, renders the sample. */
function demo(
  load: () => Promise<Record<string, unknown>>,
  render: (Component: AnyComponent) => React.ReactElement,
  exportName?: string,
) {
  return React.lazy(async () => {
    const mod = await load();
    // memo()/forwardRef() components are objects with $$typeof, not functions.
    const isRenderable = (value: unknown) =>
      typeof value === "function" ||
      (typeof value === "object" && value !== null && "$$typeof" in value);
    // Prefer PascalCase exports: lowercase helpers (resolveProbeColor, etc.)
    // are not components and throw when React calls them with props.
    const isComponent = (value: unknown) =>
      isRenderable(value) && (typeof value !== "function" || /^[A-Z]/.test(value.name ?? ""));
    const values = Object.values(mod);
    const picked =
      (exportName ? mod[exportName] : undefined) ??
      (isRenderable(mod.default) ? mod.default : undefined) ??
      // Production minification can rename functions to lowercase, so fall
      // back to the first renderable export when no PascalCase name survives.
      values.find(isComponent) ??
      values.find(isRenderable);
    // A module with no component export at all (only helpers) would render
    // `undefined` and throw, so fall back to a quiet label instead.
    if (!isRenderable(picked)) {
      return {
        default: () => <p className="text-xs text-muted-foreground">Preview unavailable</p>,
      };
    }
    const Component = picked as AnyComponent;
    return { default: () => render(Component) };
  });
}

/* ---------- bespoke demos that need refs or event wiring ---------- */

/* Alert places its title and description in the second grid column; a bare
   text child lands in the zero-width icon column and wraps word by word. */
function AlertDemo() {
  return (
    <Alert>
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>Your trial ends in 3 days.</AlertDescription>
    </Alert>
  );
}

/* Panels must live inside their Group; the bare group render throws otherwise. */
function ResizableDemo() {
  return (
    <ResizablePanelGroup orientation="horizontal" className="h-40 w-full rounded-md border">
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center text-sm">One</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center text-sm">Two</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

/* Sidebar needs its own provider; the bare component throws without it. */
function SidebarDemo() {
  return (
    <SidebarProvider>
      <div className="flex h-56 w-full overflow-hidden rounded-md border">
        <Sidebar collapsible="none" className="border-r">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>Overview</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>Shipments</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>Settings</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="p-3 text-sm text-muted-foreground">
          <SidebarTrigger className="mb-2" />
          Select a section.
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}



function AnimatedBeamDemo() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const fromRef = React.useRef<HTMLDivElement>(null);
  const toRef = React.useRef<HTMLDivElement>(null);
  return (
    <div ref={containerRef} className="relative flex h-40 w-72 items-center justify-between px-6">
      <div ref={fromRef} className="flex size-10 items-center justify-center rounded-full border bg-card text-xs">
        You
      </div>
      <div ref={toRef} className="flex size-10 items-center justify-center rounded-full border bg-card text-xs">
        API
      </div>
      <AnimatedBeam containerRef={containerRef} fromRef={fromRef} toRef={toRef} />
    </div>
  );
}

function SmoothCursorDemo() {
  return (
    <div className="flex h-40 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      Custom cursor is active over the whole page in this demo.
    </div>
  );
}

/* ---------- registry ---------- */

export const COMPONENT_DEMOS: Record<string, React.ComponentType> = {
  "3d-card": demo(() => import("@/components/ui/3d-card"), (C) => (
    <div className="w-64">
      <C>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">Order #4821</p>
          <p className="text-xs text-muted-foreground">12 tasks · due Friday</p>
        </div>
      </C>
    </div>
  )),
  "3d-marquee": demo(
    () => import("@/components/ui/3d-marquee"),
    (C) => <C images={IMAGES} className="h-72 w-full" />,
    "Marquee3D",
  ),
  "3d-pin": demo(
    () => import("@/components/ui/3d-pin"),
    (C) => <C title="Acme · Launch" href="#preview">Hover the pin</C>,
    "Pin3D",
  ),
  alert: AlertDemo,
  android: demo(() => import("@/components/ui/android"), (C) => <C videoSrc="about:blank" className="w-48" />),
  "animated-beam": AnimatedBeamDemo,
  "animated-circular-progress-bar": demo(() => import("@/components/ui/animated-circular-progress-bar"), (C) => <C value={72} />),
  "animated-gradient-text": demo(() => import("@/components/ui/animated-gradient-text"), (C) => <C>{SAMPLE_TEXT}</C>),
  "animated-grid-pattern": demo(() => import("@/components/ui/animated-grid-pattern"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border">
      <C />
    </div>
  )),
  "animated-list": demo(() => import("@/components/ui/animated-list"), (C) => (
    <C>
      {CARDS.map((card) => (
        <div key={card.id} className="w-64 rounded-md border bg-card p-3 text-sm">
          {card.title}
        </div>
      ))}
    </C>
  )),
  "animated-shiny-text": demo(() => import("@/components/ui/animated-shiny-text"), (C) => <C>Ships today</C>),
  "animated-sidebar": demo(() => import("@/components/ui/animated-sidebar"), (C) => (
    <C pinned={false} onPinnedChange={() => {}}>
      <p className="p-3 text-sm">Navigation</p>
    </C>
  )),
  "animated-tabs": demo(() => import("@/components/ui/animated-tabs"), (C) => (
    <C
      tabs={[
        { label: "Board", content: <p className="p-3 text-sm">Board panel</p> },
        { label: "Calendar", content: <p className="p-3 text-sm">Calendar panel</p> },
      ]}
    />
  )),
  "animated-testimonials": demo(() => import("@/components/ui/animated-testimonials"), (C) => (
    <C testimonials={PEOPLE.map((p) => ({ quote: "Arche cut our build time in half.", name: p.name, designation: p.designation, src: p.image }))} />
  )),
  "apple-cards-carousel": demo(() => import("@/components/ui/apple-cards-carousel"), (C) => (
    <C>{CARDS.map((card) => <div key={card.id} className="w-64 border bg-card p-4 text-sm">{card.title}</div>)}</C>
  )),
  "aurora-background": demo(() => import("@/components/ui/aurora-background"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border">
      <C />
    </div>
  )),
  "aurora-text": demo(() => import("@/components/ui/aurora-text"), (C) => <C>{SAMPLE_TEXT}</C>, "AuroraText"),
  "avatar-circles": demo(() => import("@/components/ui/avatar-circles"), (C) => <C people={PEOPLE.map((person) => person.name)} extra={7} />),
  "background-beams": demo(() => import("@/components/ui/background-beams"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border">
      <C />
    </div>
  )),
  "background-boxes": demo(() => import("@/components/ui/background-boxes"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border">
      <C />
    </div>
  )),
  backlight: demo(() => import("@/components/ui/backlight"), (C) => <C>Backlit surface</C>),
  "bento-grid": demo(() => import("@/components/ui/bento-grid"), (C) => (
    <C>
      {CARDS.map((card) => (
        <div key={card.id} className="rounded-md border bg-card p-3 text-sm">{card.title}</div>
      ))}
    </C>
  )),
  "blur-fade": demo(() => import("@/components/ui/blur-fade"), (C) => <C>Fades into view</C>),
  "border-beam": demo(() => import("@/components/ui/border-beam"), (C) => (
    <div className="relative rounded-lg border bg-card p-6 text-sm">
      <C />
      Beam border
    </div>
  )),
  breadcrumb: demo(() => import("@/components/ui/breadcrumb"), (C) => (
    <C items={[{ label: "Home", href: "#preview" }, { label: "Docs", href: "#preview" }, { label: "Breadcrumb" }]} />
  )),
  bubble: demo(() => import("@/components/ui/bubble"), (C) => <C>Thanks — shipping now.</C>),
  carousel: demo(() => import("@/components/ui/carousel"), (C) => (
    <div className="w-64">
      <C>
        {IMAGES.slice(0, 3).map((src) => (
          <img key={src} src={src} alt="" className="h-32 w-full rounded-md object-cover" />
        ))}
      </C>
    </div>
  )),
  "card-hover-effect": demo(() => import("@/components/ui/card-hover-effect"), (C) => (
    <C items={CARDS.map((c) => ({ title: c.title, description: c.description, link: "#preview" }))} />
  )),
  "card-stack": demo(() => import("@/components/ui/card-stack"), (C) => (
    <C items={CARDS.map((c) => ({ id: c.id, name: c.title, designation: c.description, content: <div /> }))} />
  )),
  chart: demo(() => import("@/components/ui/chart"), (C) => (
    <C
      id="demo-chart"
      config={{ value: { label: "Value", color: "var(--chart-1)" } }}
      className="h-40 w-64"
    >
      <div className="flex h-full w-full items-end gap-2 rounded-md border p-3">
        {[40, 65, 30, 80].map((height, index) => (
          <div key={index} className="flex-1 rounded-sm bg-[var(--chart-1)]" style={{ height: `${height}%` }} />
        ))}
      </div>
    </C>
  )),
  "code-block": demo(() => import("@/components/ui/code-block"), (C) => (
    <C code={"export const arche = 'tokens';"} language="ts" filename="arche.ts" className="w-full" />
  )),
  "code-comparison": demo(() => import("@/components/ui/code-comparison"), (C) => (
    <C beforeCode={"const before = 1;"} afterCode={"const after = 2;"} language="ts" filename="diff.ts" />
  )),
  "comic-text": demo(() => import("@/components/ui/comic-text"), (C) => <C>POW!</C>),
  "compare-slider": demo(() => import("@/components/ui/compare-slider"), (C) => (
    <C before={<img src={IMAGES[0]} alt="" className="h-40 w-full object-cover" />} after={<img src={IMAGES[1]} alt="" className="h-40 w-full object-cover" />} />
  )),
  "container-scroll": demo(() => import("@/components/ui/container-scroll"), (C) => (
    <C header={<p className="text-sm">Scroll header</p>}>
      <div className="h-40 rounded-md border bg-card p-4 text-sm">Scrolling content</div>
    </C>
  )),
  "data-grid": demo(() => import("@/components/ui/data-grid"), (C) => (
    <C
      data={[
        { name: "Ada Park", role: "Design", status: "Active" },
        { name: "Sam Ortiz", role: "Engineering", status: "Active" },
        { name: "Maya Chen", role: "Product", status: "Invited" },
      ]}
      columns={[
        { accessorKey: "name", header: "Name" },
        { accessorKey: "role", header: "Role" },
        { accessorKey: "status", header: "Status" },
      ]}
      className="w-full"
    />
  )),
  "dia-text-reveal": demo(() => import("@/components/ui/dia-text-reveal"), (C) => <C text="Dia text reveal" />),
  direction: demo(() => import("@/components/ui/direction"), (C) => <C>Right to left aware</C>),
  "direction-aware-hover": demo(() => import("@/components/ui/direction-aware-hover"), (C) => (
    <C overlay={<div className="text-sm">Overlay</div>}>
      <div className="h-32 w-52 border bg-card p-4 text-sm">Hover from any direction</div>
    </C>
  )),
  "dither-field": demo(() => import("@/components/ui/dither-field"), (C) => <C src={IMAGES[2]} className="h-40 w-full" />),
  dock: demo(() => import("@/components/ui/dock"), (C) => (
    <C>
      {["Home", "Search", "Docs", "Settings"].map((item) => (
        <div key={item} className="rounded-md border bg-card px-3 py-2 text-xs">{item}</div>
      ))}
    </C>
  )),
  "dot-pattern": demo(() => import("@/components/ui/dot-pattern"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  "dotted-glow-background": demo(() => import("@/components/ui/dotted-glow-background"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  "dotted-map": demo(() => import("@/components/ui/dotted-map"), (C) => <C className="h-40 w-full" />),
  "draggable-card": demo(() => import("@/components/ui/draggable-card"), (C) => (
    <C><div className="w-40 border bg-card p-4 text-sm">Drag me</div></C>
  )),
  empty: demo(() => import("@/components/ui/empty"), (C) => <C title="Nothing here yet">Create your first project.</C>),
  "evervault-card": demo(() => import("@/components/ui/evervault-card"), (C) => (
    <C label="Acme"><p className="text-sm">Encrypted surface</p></C>
  )),
  "expandable-card": demo(() => import("@/components/ui/expandable-card"), (C) => (
    <C title="Release notes" subtitle="v2.4" media={<img src={IMAGES[3]} alt="" className="h-32 w-full object-cover" />}>
      <p className="text-sm">Expanded detail</p>
    </C>
  )),
  "file-tree": demo(() => import("@/components/ui/file-tree"), (C) => (
    <C tree={[{ name: "app", children: [{ name: "page.tsx" }, { name: "layout.tsx" }] }, { name: "package.json" }]} />
  )),
  "flickering-grid": demo(() => import("@/components/ui/flickering-grid"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  "flip-words": demo(() => import("@/components/ui/flip-words"), (C) => <C words={WORDS} />),
  "floating-3d-particles": demo(() => import("@/components/ui/floating-3d-particles"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  "floating-navbar": demo(() => import("@/components/ui/floating-navbar"), (C) => (
    <C><span className="px-3 text-sm">Floating navbar</span></C>
  )),
  "focus-cards": demo(() => import("@/components/ui/focus-cards"), (C) => (
    <C cards={IMAGES.slice(0, 3).map((src) => ({ src, alt: "" }))} />
  )),
  "following-pointer": demo(() => import("@/components/ui/following-pointer"), (C) => (
    <C label="Pointer"><p className="text-sm">Follows the cursor</p></C>
  )),
  "glare-card": demo(() => import("@/components/ui/glare-card"), (C) => (
    <C><div className="w-52 border bg-card p-4 text-sm">Glare on hover</div></C>
  )),
  "glare-hover": demo(() => import("@/components/ui/glare-hover"), (C) => (
    <C><div className="w-52 border bg-card p-4 text-sm">Glare hover</div></C>
  )),
  globe: demo(() => import("@/components/ui/globe"), (C) => <C label="Global" className="h-48 w-64" />),
  "glowing-effect": demo(() => import("@/components/ui/glowing-effect"), (C) => (
    <div className="relative h-32 w-52 rounded-md border"><C /></div>
  )),
  "grid-pattern": demo(() => import("@/components/ui/grid-pattern"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  "hero-parallax": demo(() => import("@/components/ui/hero-parallax"), (C) => (
    <C products={IMAGES.slice(0, 3).map((src, i) => ({ title: `Product ${i + 1}`, link: "#preview", thumbnail: src }))} />
  )),
  "hexagon-pattern": demo(() => import("@/components/ui/hexagon-pattern"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  "hyper-text": demo(() => import("@/components/ui/hyper-text"), (C) => <C>Decoding</C>),
  "icon-cloud": demo(() => import("@/components/ui/icon-cloud"), (C) => <C images={IMAGES} className="h-48 w-full" />),
  "image-slider": demo(() => import("@/components/ui/image-slider"), (C) => <C images={IMAGES.slice(0, 3)} className="w-64" />),
  "interactive-grid-pattern": demo(() => import("@/components/ui/interactive-grid-pattern"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  iphone: demo(() => import("@/components/ui/iphone"), (C) => <C src={IMAGES[1]} className="w-40" />),
  item: demo(() => import("@/components/ui/item"), (C) => <C title="Invoice #204">Paid · $480</C>),
  kbd: demo(() => import("@/components/ui/kbd"), (C) => <C>⌘K</C>),
  "kinetic-text": demo(() => import("@/components/ui/kinetic-text"), (C) => <C text="Kinetic" />),
  lamp: demo(() => import("@/components/ui/lamp"), (C) => <C><p className="p-4 text-sm">Lit surface</p></C>),
  "layout-grid": demo(() => import("@/components/ui/layout-grid"), (C) => (
    <C items={IMAGES.slice(0, 3).map((src, i) => ({ id: i + 1, content: <span className="text-xs">Card {i + 1}</span>, className: "bg-card", thumbnail: src }))} />
  )),
  lens: demo(() => import("@/components/ui/lens"), (C) => <C><p className="text-sm">Hover to magnify</p></C>),
  "light-rays": demo(() => import("@/components/ui/light-rays"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  "line-shadow-text": demo(() => import("@/components/ui/line-shadow-text"), (C) => <C>Line shadow</C>),
  loaders: demo(() => import("@/components/ui/loaders"), (C) => <C />),
  "logo-cloud": demo(
    () => import("@/components/blocks/logo-cloud"),
    (C) => <C caption="Powering packing lines at" />,
    "LogoCloud",
  ),
  "macbook-scroll": demo(() => import("@/components/ui/macbook-scroll"), (C) => (
    <C src={IMAGES[0]} title="Acme on Mac" badge="New" className="w-full" />
  )),
  "magic-card": demo(() => import("@/components/ui/magic-card"), (C) => (
    <C><div className="w-52 border bg-card p-4 text-sm">Spotlight follows</div></C>
  )),
  marker: demo(() => import("@/components/ui/marker"), (C) => <C>Marked note</C>),
  marquee: demo(() => import("@/components/ui/marquee"), (C) => (
    <C>{["Design", "Build", "Ship", "Scale"].map((w) => <span key={w} className="px-4 text-sm">{w}</span>)}</C>
  )),
  message: demo(() => import("@/components/ui/message"), (C) => <C>Can you review the release notes?</C>),
  meteors: demo(() => import("@/components/ui/meteors"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  "morphing-text": demo(() => import("@/components/ui/morphing-text"), (C) => <C texts={WORDS} />),
  "moving-border": demo(() => import("@/components/ui/moving-border"), (C) => <C>Moving border</C>),
  "multi-step-loader": demo(() => import("@/components/ui/multi-step-loader"), (C) => (
    <C steps={STEPS.map((text) => ({ text }))} current={1} loading={false} />
  )),
  "navbar-menu": demo(() => import("@/components/ui/navbar-menu"), (C) => (
    <C><span className="px-3 text-sm">Menu</span></C>
  )),
  "neon-gradient-card": demo(() => import("@/components/ui/neon-gradient-card"), (C) => (
    <C><div className="w-52 p-4 text-sm">Neon border</div></C>
  )),
  "noise-background": demo(() => import("@/components/ui/noise-background"), (C) => <C><p className="p-4 text-sm">Noise</p></C>),
  "noise-texture": demo(() => import("@/components/ui/noise-texture"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  "number-ticker": demo(() => import("@/components/ui/number-ticker"), (C) => <C value={1284} />),
  "orbiting-circles": demo(() => import("@/components/ui/orbiting-circles"), (C) => (
    <C><div className="size-10 rounded-full bg-brand" /></C>
  )),
  pagination: demo(() => import("@/components/ui/pagination"), (C) => <C page={2} total={5} />),
  "parallax-grid": demo(() => import("@/components/ui/parallax-grid"), (C) => (
    <C>{IMAGES.slice(0, 3).map((src) => <img key={src} src={src} alt="" className="h-32 w-full object-cover" />)}</C>
  )),
  particles: demo(() => import("@/components/ui/particles"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  "pixel-image": demo(() => import("@/components/ui/pixel-image"), (C) => <C src={IMAGES[2]} className="h-40 w-full" />),
  pointer: demo(() => import("@/components/ui/pointer"), (C) => <C><span className="text-sm">Pointer</span></C>),
  "pointer-highlight": demo(() => import("@/components/ui/pointer-highlight"), (C) => <C>Highlighted phrase</C>),
  "progressive-blur": demo(() => import("@/components/ui/progressive-blur"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  resizable: ResizableDemo,
  "resizable-navbar": demo(() => import("@/components/ui/resizable-navbar"), (C) => (
    <C
      logo={<span className="text-sm font-medium">Acme</span>}
      items={[{ name: "Product", link: "#preview" }, { name: "Pricing", link: "#preview" }]}
      cta={<span className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">Start</span>}
    />
  )),
  "retro-grid": demo(() => import("@/components/ui/retro-grid"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  ripple: demo(() => import("@/components/ui/ripple"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  safari: demo(() => import("@/components/ui/safari"), (C) => <C imageSrc={IMAGES[0]} url="arche.dev" className="w-full" />),
  "scroll-based-velocity": demo(() => import("@/components/ui/scroll-based-velocity"), (C) => (
    <C><span className="text-sm">Scroll-based velocity</span></C>
  )),
  "scroll-progress": demo(() => import("@/components/ui/scroll-progress"), (C) => (
    <div className="relative h-40 w-full overflow-auto rounded-md border">
      <C />
      <div className="h-96 p-4 text-sm">Scroll to see progress</div>
    </div>
  )),
  "scroll-velocity": demo(() => import("@/components/ui/scroll-velocity"), (C) => (
    <C><span className="px-4 text-sm">Scroll velocity</span></C>
  )),
  "shine-border": demo(() => import("@/components/ui/shine-border"), (C) => (
    <C><div className="w-52 p-4 text-sm">Shine border</div></C>
  )),
  "shooting-stars": demo(() => import("@/components/ui/shooting-stars"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  sidebar: SidebarDemo,
  "smooth-cursor": SmoothCursorDemo,
  "sparkles-text": demo(() => import("@/components/ui/sparkles-text"), (C) => <C>Sparkles</C>),
  spinner: demo(() => import("@/components/ui/spinner"), (C) => <C />),
  "spinning-text": demo(() => import("@/components/ui/spinning-text"), (C) => <C>Spinning</C>),
  "spotlight-card": demo(() => import("@/components/ui/spotlight-card"), (C) => (
    <C><div className="w-52 p-4 text-sm">Spotlight</div></C>
  )),
  "sticky-banner": demo(() => import("@/components/ui/sticky-banner"), (C) => (
    <C onDismiss={() => {}}>Sticky announcement</C>
  )),
  "sticky-scroll": demo(() => import("@/components/ui/sticky-scroll"), (C) => (
    <C items={CARDS.slice(0, 2).map((c) => ({ title: c.title, description: c.description, content: <div className="text-sm">{c.title}</div> }))} />
  )),
  "striped-pattern": demo(() => import("@/components/ui/striped-pattern"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  terminal: demo(() => import("@/components/ui/terminal"), (C) => (
    <C lines={["$ pnpm add @arche/ui", "✓ installed", "$ pnpm dev"]} />
  )),
  "text-3d-flip": demo(() => import("@/components/ui/text-3d-flip"), (C) => <C>3D flip</C>),
  "text-animate": demo(() => import("@/components/ui/text-animate"), (C) => <C>Animated text</C>),
  "text-highlighter": demo(() => import("@/components/ui/text-highlighter"), (C) => <C>Highlighted text</C>),
  "text-hover-effect": demo(() => import("@/components/ui/text-hover-effect"), (C) => <C text="HOVER" />),
  "text-reveal": demo(() => import("@/components/ui/text-reveal"), (C) => <C text="Revealed on scroll" />),
  "text-shimmer": demo(() => import("@/components/ui/text-shimmer"), (C) => <C>Shimmering text</C>),
  "tilt-card": demo(() => import("@/components/ui/tilt-card"), (C) => (
    <C><div className="w-52 p-4 text-sm">Tilt on hover</div></C>
  )),
  timeline: demo(() => import("@/components/ui/timeline"), (C) => (
    <C items={[{ title: "Founded", description: "2024" }, { title: "Launched", description: "2025" }]} />
  )),
  trace: demo(() => import("@/components/ui/trace"), (C) => <C className="h-32 w-full" />),
  "tracing-beam": demo(() => import("@/components/ui/tracing-beam"), (C) => (
    <C><p className="p-4 text-sm">Tracing beam content</p></C>
  )),
  "tweet-card": demo(() => import("@/components/ui/tweet-card"), (C) => (
    <C name="Ada Park" handle="adapark" content="Arche made our design system token-first." avatar={PEOPLE[0]!.image} time="2h" />
  )),
  typewriter: demo(() => import("@/components/ui/typewriter"), (C) => <C words={WORDS} />),
  "typing-animation": demo(() => import("@/components/ui/typing-animation"), (C) => <C words={WORDS} />),
  "video-text": demo(() => import("@/components/ui/video-text"), (C) => <C src="about:blank">Arche</C>),
  vortex: demo(() => import("@/components/ui/vortex"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  "warp-background": demo(() => import("@/components/ui/warp-background"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  "wavy-background": demo(() => import("@/components/ui/wavy-background"), (C) => (
    <div className="relative h-40 w-full overflow-hidden rounded-md border"><C /></div>
  )),
  "wobble-card": demo(() => import("@/components/ui/wobble-card"), (C) => (
    <C><div className="w-52 p-4 text-sm">Wobble</div></C>
  )),
  "word-rotate": demo(() => import("@/components/ui/word-rotate"), (C) => <C words={WORDS} />),
  "world-map": demo(() => import("@/components/ui/world-map"), (C) => <C label="Global" className="h-40 w-full" />),
};

export const hasComponentDemo = (name: string) => Object.hasOwn(COMPONENT_DEMOS, name);

export function ComponentDemo({ name }: { name: string }) {
  const Demo = COMPONENT_DEMOS[name];
  if (!Demo) return null;
  return (
    <React.Suspense fallback={<p className="text-sm text-muted-foreground">Loading preview…</p>}>
      <Demo />
    </React.Suspense>
  );
}
