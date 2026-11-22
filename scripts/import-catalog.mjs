import fs from "node:fs";
import path from "node:path";

const catalogPath = process.argv[2] ?? "catalog-aggregate.json";
const SRC = "packages/foundation/src";
const TPL = `${SRC}/templates`;
const MAN = `${SRC}/manifests`;
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const writeJson = (f, v) => fs.writeFileSync(f, `${JSON.stringify(v, null, 2)}\n`);

const OLD = `accordion alert-dialog aspect-ratio avatar badge button card checkbox collapsible context-menu dialog dropdown-menu hover-card input label menubar navigation-menu popover progress radio-group scroll-area select separator skeleton slider switch table tabs textarea toast toggle-group toggle tooltip`.split(" ");

// Verify these against your manifest schema's category values.
const CATEGORY = { "Forms & Inputs": "forms", "Buttons & Actions": "actions", "Overlays, Menus & Dialogs": "overlay", Navigation: "navigation", "Data Display": "display", "Feedback & Status": "feedback", "Layout & Structure": "layout", "Text & Typography": "typography", "Backgrounds & Patterns": "background", Cards: "cards", "Scroll & Motion": "motion", "Media, Mockups & Code": "media", "Cursor & Pointer": "cursor", "Social Proof & People": "social" };

// slug: description | use when | do not use when
const META = {
  attachment: "A file or media attachment with status and actions.|Users review attached files.|Users need to select files.",
  calendar: "A date grid for single, multiple, or range selection.|Surrounding dates give useful context.|A known date is faster to type.",
  checkbox: "A control for independent on or off choices.|Several options can be selected.|Only one option may be selected.",
  combobox: "A searchable list of selectable options.|The option list is long.|There are only a few options.",
  "date-picker": "A button that opens a calendar to choose a date.|Form space is limited.|The calendar must stay visible.",
  field: "Label, description, and error layout for form controls.|Building accessible forms.|Content is not a form control.",
  "file-drop": "A drag and drop upload zone.|Users upload local files.|Files come from an existing library.",
  input: "A single line text control.|Collecting short values.|Collecting multiline text.",
  "input-group": "An input with attached text, icons, or buttons.|Add-ons belong to one input.|Controls are unrelated.",
  "input-otp": "Segmented entry for one-time codes.|Entering a fixed length code.|Length is variable.",
  label: "An accessible caption for a control.|Naming a form control.|Styling ordinary text.",
  "native-select": "A styled native select element.|Platform pickers are preferred.|Options need rich content.",
  questionnaire: "A guided sequence of questions.|Collecting answers step by step.|A short form fits on one screen.",
  "radio-group": "A set of mutually exclusive choices.|Exactly one visible option applies.|Several options can apply.",
  select: "A dropdown for choosing one option.|Choosing from a moderate list.|Users need to search options.",
  slider: "A draggable control for numeric values.|Approximate values are acceptable.|An exact value is required.",
  stepper: "Progress through ordered steps.|A flow has distinct stages.|Sections can be visited in any order.",
  switch: "An immediate on or off setting.|Changes apply instantly.|Changes require submission.",
  textarea: "A multiline text control.|Collecting longer text.|Collecting short values.",
  "vanish-input": "A search field with cycling placeholders.|Suggesting example queries.|The placeholder carries required instructions.",
  button: "A control that triggers an action.|Users perform an action.|Navigating with plain text links.",
  "button-group": "Related buttons joined together.|Actions share a context.|Actions are unrelated.",
  confetti: "A button that fires a confetti burst.|Celebrating a milestone.|Routine or destructive actions.",
  "cool-mode": "A particle effect around an interactive child.|Adding playful feedback.|The interface is task critical.",
  "interactive-hover-button": "A button with a sliding hover reveal.|Highlighting a marketing action.|Dense application toolbars.",
  "magnetic-button": "A button that leans toward the cursor.|Emphasizing one hero action.|Many buttons are adjacent.",
  "pulsating-button": "A button with an attention pulse.|One action needs attention.|Several actions compete.",
  "rainbow-button": "A call to action with a brand gradient.|A single brand moment.|Secondary actions.",
  "ripple-button": "A button that ripples from the press point.|Press feedback matters.|Motion would distract.",
  "shimmer-button": "A call to action with a light sweep.|Highlighting a primary action.|Repeated list actions.",
  "shiny-button": "A button with a moving shine.|Promoting a feature.|Routine form submission.",
  "stateful-button": "A button showing loading and result states.|Actions are asynchronous.|Actions finish instantly.",
  "theme-toggler": "A light and dark mode switch.|Users control the theme.|The theme is fixed.",
  toggle: "A two state button.|Turning one option on or off.|Submitting an action.",
  "toggle-group": "A set of related toggle buttons.|Choosing view or format options.|Navigating between pages.",
  "alert-dialog": "A blocking confirmation dialog.|Confirming destructive actions.|Showing optional information.",
  "animated-modal": "A modal with spring animation.|A focused task deserves emphasis.|Dialogs open frequently.",
  "animated-tooltip": "An avatar row with name tooltips.|Showing a small group of people.|Showing large member lists.",
  command: "A searchable command menu.|Users search many actions.|There are only a few actions.",
  "context-menu": "A menu opened by right click or long press.|Offering shortcuts for an object.|It is the only path to an action.",
  dialog: "A modal window for focused tasks.|A task interrupts the page briefly.|Content belongs inline.",
  drawer: "A draggable edge panel.|Mobile friendly secondary tasks.|Content must stay visible.",
  "dropdown-menu": "A menu opened from a trigger.|Grouping related actions.|Selecting a form value.",
  "hero-video-dialog": "A thumbnail that opens a video overlay.|Featuring a product video.|Video should play inline.",
  "hover-card": "A preview shown on hover or focus.|Previewing linked content.|Content is essential on touch devices.",
  menubar: "A persistent row of menus.|Desktop style applications.|Simple site navigation.",
  popover: "Floating content anchored to a trigger.|Showing small contextual controls.|A blocking decision is required.",
  sheet: "A side panel dialog.|Editing details beside the page.|A short confirmation is enough.",
  tooltip: "A short hint for a control.|Clarifying an icon button.|Content is interactive.",
  "animated-sidebar": "An icon rail that expands on hover and becomes a drawer on small screens.|Collapsing app navigation.|Top level site links.",
  "animated-tabs": "Tabs with a gliding pill and stacked card panels.|Switching a few views in place.|Long scrolling content.",
  breadcrumb: "A trail of links showing the current location.|Deep page hierarchies.|Flat two level sites.",
  dock: "A magnifying app dock.|Playful app launchers.|Dense toolbars.",
  "floating-navbar": "A navbar that hides on scroll down and returns on scroll up.|Saving vertical space.|Always visible navigation.",
  "navbar-menu": "A hover menu with a morphing pill and panel.|Rich site navigation.|Simple link lists.",
  pagination: "Numbered page controls.|Splitting long lists.|Short lists on one page.",
  "resizable-navbar": "A full width navbar that shrinks into a floating pill on scroll.|Marketing headers.|App toolbars.",
  sidebar: "A collapsible app sidebar.|App navigation with sections.|Marketing pages.",
  "sticky-banner": "A dismissible announcement bar above the header.|Temporary announcements.|Permanent navigation.",
  "animated-list": "A looping feed that springs items in newest first.|Live activity previews.|Static lists.",
  bubble: "A speech bubble with reactions.|Chat excerpts.|Formal content.",
  chart: "A theme aware chart wrapper.|Showing trends.|Single exact values.",
  "data-grid": "A sortable filterable table with selection and pagination.|Managing rows of records.|Simple read only tables.",
  "dotted-map": "A dotted world map.|Geographic coverage at a glance.|Precise boundaries.",
  "file-tree": "A collapsible project structure tree.|Documenting file layouts.|Deep navigation.",
  globe: "A dotted canvas globe with markers and arcs.|Global presence visuals.|Accurate maps.",
  "icon-cloud": "An interactive 3D tag cloud.|Technology lists.|Plain link lists.",
  item: "A list row with media and actions.|Settings and inbox rows.|Freeform article text.",
  kbd: "A keyboard key label.|Documenting shortcuts.|General emphasis.",
  marker: "A labeled divider row.|Separating timeline entries.|Page section headings.",
  message: "A chat message bubble.|Conversations.|Email threads.",
  trace: "An expandable execution trace.|Showing agent or build steps.|Simple logs.",
  "world-map": "A dotted SVG world map with markers and arcs.|Coverage visuals.|Navigation maps.",
  alert: "A notice with title and description.|Status messages.|Blocking confirmations.",
  "animated-circular-progress-bar": "A circular gauge with a percentage.|Single progress values.|Multiple parallel tasks.",
  empty: "An illustrated empty state with action.|No results or first run.|Error states.",
  loaders: "Tiny CSS loading indicators.|Inline waiting states.|Full page loads.",
  "multi-step-loader": "A full screen overlay ticking through steps.|Long operations.|Instant actions.",
  "number-ticker": "A number that springs up in view.|Animated statistics.|Static figures.",
  spinner: "A theme aware loading spinner.|Waiting states.|Progress with a known end.",
  "apple-cards-carousel": "Snap scrolling image cards opening into story modals.|Visual showcases.|Text articles.",
  "bento-grid": "A feature grid with hover CTAs.|Feature overviews.|Linear narratives.",
  carousel: "A snap carousel with controls.|Grouped content browsing.|Single hero messages.",
  "compare-slider": "A before and after wipe with a divider.|Visual comparisons.|Single images.",
  direction: "A text direction provider.|Mixed language layouts.|Single direction pages.",
  "image-slider": "A full bleed slider with autoplay and swipe.|Photo stories.|Single images.",
  "layout-grid": "Image tiles expanding in place.|Visual portfolios.|Dense data.",
  resizable: "Resizable split panels.|Adjustable layouts.|Fixed layouts.",
  timeline: "A vertical timeline with a scroll fill beam.|Histories and roadmaps.|Unordered content.",
  "animated-gradient-text": "A brand gradient sweeping through text.|Hero headlines.|Body copy.",
  "animated-shiny-text": "A glare panning across text.|Shimmering headlines.|Long paragraphs.",
  "aurora-text": "An aurora gradient text effect.|Atmospheric headlines.|Small labels.",
  "comic-text": "A playful comic text animation.|Playful headlines.|Formal documents.",
  "dia-text-reveal": "A color band sweeping across text into a shine.|Dramatic reveals.|Body text.",
  "flip-words": "Words cycling with a blur flip.|Rotating value props.|Static headings.",
  "glyph-matrix": "An animated grid of shifting glyphs.|Decorative code texture.|Readable text.",
  "hyper-text": "Text resolving from scrambled letters.|Hero reveals.|Long content.",
  "kinetic-text": "Weight animating characters on hover.|Interactive headlines.|Paragraphs.",
  "line-shadow-text": "Text with a moving line shadow.|Stylized headings.|Body copy.",
  "morphing-text": "Phrases blurring into each other.|Rotating messages.|Static titles.",
  "sparkles-text": "Twinkling stars orbiting a headline.|Celebratory headings.|Form labels.",
  "spinning-text": "Text animating in a circle.|Circular badges.|Sentences.",
  "text-3d-flip": "Letters flipping in 3D on hover.|Interactive headings.|Touch interfaces.",
  "text-animate": "Text animating in with preset effects.|Entrance headlines.|Long articles.",
  "text-highlighter": "A marker sweep drawing in on scroll.|Emphasized phrases.|Whole paragraphs.",
  "text-hover-effect": "A giant outlined word glowing under the pointer.|Statement sections.|Navigation.",
  "text-reveal": "Word by word blur reveal on scroll.|Scroll storytelling.|Short labels.",
  "text-shimmer": "A soft light sweep for loading states.|AI waiting states.|Final content.",
  typewriter: "Words typing holding and deleting.|Rotating roles.|Static copy.",
  "typing-animation": "Characters appearing as typed.|Terminal effects.|Instant text.",
  "video-text": "Text with video playing behind it.|Cinematic headlines.|Readable body.",
  "word-rotate": "A single word rolling vertically.|Rotating keywords.|Sentences.",
  "animated-grid-pattern": "An animated SVG grid backdrop.|Technical section texture.|Plain cards.",
  "aurora-background": "A drifting aurora gradient backdrop.|Atmospheric heroes.|Dense dashboards.",
  "background-beams": "Light beams flowing on curved paths.|Hero depth.|Text heavy pages.",
  "background-boxes": "An isometric grid lighting under the pointer.|Playful heroes.|Calm layouts.",
  backlight: "A glow behind media.|Spotlighting visuals.|Flat illustrations.",
  "dither-field": "An animated dithered dot WebGL field.|Ambient motion.|Low power devices.",
  "dot-pattern": "An SVG dot pattern backdrop.|Subtle section texture.|Busy content.",
  "dotted-glow-background": "A canvas dot grid brightened by glows.|Ambient heroes.|Data dense screens.",
  "flickering-grid": "Squares fading on staggered timers.|Ambient grids.|Static layouts.",
  "floating-3d-particles": "A pseudo 3D particle field.|Depth backdrops.|Reduced motion needs.",
  "grid-pattern": "SVG grid and dot backdrops.|Technical texture.|Plain surfaces.",
  "hexagon-pattern": "An SVG hexagon backdrop.|Geometric texture.|Minimal layouts.",
  "interactive-grid-pattern": "A grid reacting to the pointer.|Interactive heroes.|Static pages.",
  lamp: "A glowing lamp line header.|Dramatic section openers.|Small sections.",
  "light-rays": "God rays fanning from the top.|Hero atmosphere.|Bright themes.",
  meteors: "Falling meteor streaks.|Dark hero drama.|Light sections.",
  "noise-background": "Gradient blobs under film grain.|Rich ambient wraps.|Flat minimal pages.",
  "noise-texture": "An SVG noise overlay.|Film grain texture.|Clean vector looks.",
  particles: "A drifting twinkling particle canvas.|Ambient depth.|Performance budgets.",
  "retro-grid": "A perspective grid scrolling to the horizon.|Retro heroes.|Corporate pages.",
  ripple: "Concentric rings pulsing outward.|Calm listening states.|Busy screens.",
  "shooting-stars": "A star field with shooting streaks.|Night sky heroes.|Daylight themes.",
  "striped-pattern": "An SVG striped backdrop.|Diagonal texture.|Quiet surfaces.",
  vortex: "Particles spiralling to the center.|Hypnotic loaders.|Content sections.",
  "warp-background": "A time warp card background.|Sci-fi cards.|Readable panels.",
  "wavy-background": "Flowing translucent brand ribbons.|Fluid section breaks.|Sharp layouts.",
  "3d-card": "A card turning toward the pointer.|Product spotlights.|Dense grids.",
  "3d-pin": "A card tilting as a pin rises.|Map style pins.|Plain links.",
  "border-beam": "Light traveling around a border.|Highlighting panels.|Quiet cards.",
  "card-hover-effect": "A highlight gliding between link cards.|Card grids.|Single cards.",
  "card-stack": "A deck shuffling on a timer.|Rotating testimonials.|Static lists.",
  "direction-aware-hover": "An overlay entering from the crossed edge.|Image grids.|Text links.",
  "draggable-card": "Photo cards flung with inertia.|Playful boards.|Ordered content.",
  "evervault-card": "Characters shuffling through a pointer mask.|Security features.|Plain cards.",
  "expandable-card": "A card expanding into a panel.|Preview to detail.|Separate pages.",
  "focus-cards": "A grid where hover sharpens one card.|Image showcases.|Text grids.",
  "glare-card": "Cursor tracked foil glare.|Premium cards.|Subtle interfaces.",
  "glare-hover": "A diagonal glare on hover.|Button polish.|Flat design.",
  "glowing-effect": "Border glow following the pointer.|Nearby card glow.|Static borders.",
  "magic-card": "A cursor spotlight on borders.|Feature cards.|Plain panels.",
  "moving-border": "Light lapping a border via offset path.|Call to action borders.|Quiet buttons.",
  "neon-gradient-card": "A neon gradient card.|Vibrant promos.|Muted themes.",
  "shine-border": "An animated shine border.|Highlighted panels.|Default borders.",
  "spotlight-card": "A radial glow following the cursor.|Interactive cards.|Static content.",
  "tilt-card": "3D tilt tracking the cursor.|Product cards.|Text heavy cards.",
  "wobble-card": "A card drifting toward the pointer.|Playful promos.|Formal layouts.",
  "3d-marquee": "A tilted image grid scrolling endlessly.|Visual walls.|Text tickers.",
  "animated-beam": "An animated connection between elements.|Architecture diagrams.|Unrelated items.",
  "blur-fade": "Blur fade and drift entrances.|Scroll entrances.|Instant content.",
  "container-scroll": "A panel rotating flat on scroll.|Product reveals.|Static screenshots.",
  "hero-parallax": "Card rows sliding apart on scroll.|Parallax heroes.|Simple headers.",
  "macbook-scroll": "A laptop opening on scroll.|Device showcases.|Mobile first pages.",
  marquee: "A seamless scrolling loop.|Logo and image tickers.|Critical announcements.",
  "orbiting-circles": "Items on rotating orbital rings.|Ecosystem visuals.|Linear lists.",
  "parallax-grid": "Gallery columns drifting at rates.|Depth galleries.|Uniform grids.",
  "pixel-image": "An image with a pixelated effect.|Retro reveals.|Crisp photography.",
  "progressive-blur": "A blur gradient on scrollable edges.|Overflow hints.|Fully visible content.",
  "scroll-based-velocity": "Text speed following scroll.|Energetic tickers.|Calm pages.",
  "scroll-progress": "A gradient page progress bar.|Long articles.|Short pages.",
  "scroll-velocity": "A marquee following scroll speed.|Playful tickers.|Readable banners.",
  "sticky-scroll": "Copy scrolling past a swapping panel.|Feature stories.|Short sections.",
  "tracing-beam": "A gradient line drawing down content.|Long form guides.|Short posts.",
  android: "An Android device mockup.|Mobile showcases.|Desktop content.",
  "code-block": "Code with copy button and diff lines.|Documentation snippets.|Prose.",
  "code-comparison": "Two code snippets compared.|Before and after code.|Single snippets.",
  iphone: "An iPhone mockup.|Mobile showcases.|Responsive pages.",
  safari: "A Safari browser mockup.|Website showcases.|Native apps.",
  terminal: "A terminal typing its lines.|CLI demos.|Static code.",
  "following-pointer": "A name tag trailing the pointer.|Presence indicators.|Default cursors.",
  lens: "A magnifier zooming into images.|Product inspection.|Small thumbnails.",
  pointer: "A pointer shown over elements.|Guided tours.|Native cursors.",
  "pointer-highlight": "An outline drawn around a phrase.|Guided emphasis.|Plain highlights.",
  "smooth-cursor": "A spring trailed custom cursor.|Immersive sites.|Form heavy apps.",
  "animated-testimonials": "Rotating quotes over portraits.|Social proof.|Single quotes.",
  "avatar-circles": "Stacked initial avatars with a count.|Team presence.|Single authors.",
  "logo-cloud": "Customer logos muted until hover.|Trust sections.|Single logos.",
  "tweet-card": "A static social proof card.|Testimonials.|Live feeds.",
};

// Component tokens: [knob, allowed values, default, ...[find, template]]
// {p} becomes (--component-knob,default); {v} becomes var(--component-knob,default).
// Knob names must not collide with the editor's NON_TOKEN_KNOBS.
const k = (knob, values, def, ...edits) => ({ knob, values: values.split(" "), def, edits });
const H = "2rem 2.25rem 2.5rem 2.75rem 3rem 3.5rem";
const W = "16rem 18rem 20rem 24rem 28rem 32rem 36rem 42rem 56rem";
const S = "0.875rem 1rem 1.125rem 1.25rem 1.5rem";
const R = "0px 0.375rem 0.625rem 1rem 9999px";
const height = (find, def) => k("height", H, def, [find, find.replace(/h-\d+/, "h-{p}")]);
const radius = (find) => k("cornerShape", R, "9999px", [find, find.replace("rounded-full", "rounded-{p}")]);
const overlay = () => k("overlayOpacity", "20% 30% 40% 50% 60% 70%", "40%", ["bg-black/50", "bg-foreground/[{v}]"]);
const menuWidth = () => k("menuMinWidth", "8rem 10rem 12rem 14rem", "8rem", ["min-w-[8rem]", "min-w-{p}"]);

const TOKENS = {
  attachment: [
    k("verticalWidth", "5rem 6rem 7rem 8rem", "6rem", ["w-24 flex-col", "w-{p} flex-col"]),
    k("mediaWidth", "2rem 2.5rem 3rem 3.5rem", "2.5rem", ["aspect-square w-10", "aspect-square w-{p}"]),
  ],
  calendar: [k("cellSize", "1.75rem 2rem 2.25rem 2.5rem", "2rem", ["[--cell-size:--spacing(8)]", "[--cell-size:{v}]"])],
  checkbox: [k("boxSize", S, "1rem", ["peer size-4", "peer size-{p}"])],
  combobox: [k("listMaxHeight", "16rem 20rem 24rem 28rem", "24rem", ["max-h-96 w-(--anchor-width)", "max-h-{p} w-(--anchor-width)"])],
  "date-picker": [k("width", W, "18rem")],
  field: [k("groupGap", "1rem 1.25rem 1.5rem 1.75rem 2rem", "1.75rem", ["flex-col gap-7", "flex-col gap-{p}"])],
  "file-drop": [k("zonePadding", "1.5rem 2rem 2.5rem 3rem", "2.5rem", ["p-10", "p-{p}"])],
  input: [k("paddingX", "0.5rem 0.75rem 1rem", "0.75rem", ["px-3 py-1", "px-{p} py-1"])],
  "input-otp": [k("slotSize", H, "2.25rem", ["h-9 w-9", "size-{p}"])],
  "native-select": [height("h-9 w-full", "2.25rem")],
  "radio-group": [k("itemSize", S, "1rem", ["aspect-square size-4", "aspect-square size-{p}"])],
  select: [
    k("height", H, "2.25rem", ["data-[size=default]:h-9", "data-[size=default]:h-{p}"]),
    menuWidth(),
  ],
  slider: [
    k("trackThickness", "0.25rem 0.375rem 0.5rem 0.75rem", "0.375rem",
      ["data-[orientation=horizontal]:h-1.5", "data-[orientation=horizontal]:h-{p}"],
      ["data-[orientation=vertical]:w-1.5", "data-[orientation=vertical]:w-{p}"]),
    k("thumbSize", S, "1rem", ["block size-4", "block size-{p}"]),
  ],
  stepper: [k("markerSize", "1.5rem 1.75rem 2rem 2.5rem", "2rem",
    ["grid size-8", "grid size-{p}"],
    ["top-4 right-4 left-4", "top-[calc({v}/2)] right-[calc({v}/2)] left-[calc({v}/2)]"])],
  switch: [
    k("trackHeight", "1.15rem 1.25rem 1.5rem", "1.15rem", ["data-[size=default]:h-[1.15rem]", "data-[size=default]:h-{p}"]),
    k("trackWidth", "2rem 2.25rem 2.5rem", "2rem", ["data-[size=default]:w-8", "data-[size=default]:w-{p}"]),
  ],
  textarea: [k("minHeight", "3rem 4rem 5rem 6rem 8rem", "4rem", ["min-h-16", "min-h-{p}"])],
  "vanish-input": [height("h-12 w-full", "3rem"), radius("rounded-full border")],
  button: [
    k("height", H, "2.25rem", ["h-9 px-4 py-2", "h-{p} px-4 py-2"], ['"size-9"', '"size-{p}"']),
    k("heightSm", "1.75rem 2rem 2.25rem", "2rem", ["h-8 gap-1.5", "h-{p} gap-1.5"]),
    k("heightLg", H, "2.5rem", ["h-10 rounded-md px-6", "h-{p} rounded-md px-6"]),
  ],
  confetti: [height("h-11 cursor-pointer", "2.75rem"), radius("rounded-full border bg-card")],
  "interactive-hover-button": [radius("rounded-full border p-2")],
  "magnetic-button": [height("h-11 cursor-pointer", "2.75rem")],
  "rainbow-button": [height("h-11 cursor-pointer", "2.75rem")],
  "ripple-button": [height("h-11 cursor-pointer", "2.75rem")],
  "shimmer-button": [height("h-12 cursor-pointer", "3rem"), radius("rounded-full bg-primary")],
  "stateful-button": [height("h-10 cursor-pointer", "2.5rem"), radius("rounded-full px-5")],
  "theme-toggler": [k("buttonSize", H, "2.25rem", ["grid size-9", "grid size-{p}"])],
  toggle: [height("h-9 min-w-9", "2.25rem")],
  "alert-dialog": [k("width", W, "32rem", ["data-[size=default]:sm:max-w-lg", "data-[size=default]:sm:max-w-{p}"]), overlay()],
  "animated-modal": [k("width", W, "32rem", ["max-w-lg overflow-hidden", "max-w-{p} overflow-hidden"])],
  "animated-tooltip": [k("avatarSize", H, "2.75rem", ["size-11", "size-{p}"])],
  command: [k("listMaxHeight", "200px 300px 400px 500px", "300px", ["max-h-[300px]", "max-h-{p}"])],
  "context-menu": [menuWidth()],
  dialog: [k("width", W, "32rem", ["sm:max-w-lg", "sm:max-w-{p}"]), overlay()],
  drawer: [
    k("handleWidth", "64px 80px 100px 120px", "100px", ["w-[100px]", "w-{p}"]),
    k("sideWidth", W, "24rem", ["sm:max-w-sm", "sm:max-w-{p}"]),
    overlay(),
  ],
  "dropdown-menu": [menuWidth()],
  "hero-video-dialog": [k("width", W, "56rem", ["max-w-4xl", "max-w-{p}"])],
  "hover-card": [k("width", W, "16rem", ["w-64", "w-{p}"])],
  menubar: [height("h-9 items-center", "2.25rem"), k("menuMinWidth", "10rem 12rem 14rem 16rem", "12rem", ["min-w-[12rem]", "min-w-{p}"])],
  popover: [k("width", W, "18rem", ["w-72", "w-{p}"])],
  sheet: [k("width", W, "24rem", ["sm:max-w-sm", "sm:max-w-{p}"]), overlay()],
  tooltip: [k("arrowSize", "0.5rem 0.625rem 0.75rem", "0.625rem", ["size-2.5", "size-{p}"])],
};

const axis = (values, def = "default") => ({ values: values.split(" "), default: def });
const AXES = {
  attachment: { size: axis("default sm xs"), orientation: axis("horizontal vertical", "horizontal") },
  button: { variant: axis("default destructive outline secondary ghost link brand"), size: axis("default xs sm lg icon icon-xs icon-sm icon-lg") },
  "button-group": { orientation: axis("horizontal vertical", "horizontal") },
  field: { orientation: axis("vertical horizontal responsive", "vertical") },
  input: { controlSize: axis("sm default lg") },
  // Sub-component cvas (Addon align, Button size) live in the same file and
  // are stamped by the emitter's per-cva pass like any root variant.
  "input-group": {
    align: axis("inline-start inline-end block-start block-end", "inline-start"),
    size: axis("xs sm icon-xs icon-sm", "xs"),
  },
  toggle: { variant: axis("default outline"), size: axis("default sm lg") },
  sidebar: { variant: axis("default outline"), size: axis("default sm lg") },
  bubble: {
    variant: axis("default secondary muted tinted outline ghost destructive"),
    side: axis("top bottom", "bottom"),
    align: axis("start end", "end"),
  },
  item: {
    variant: axis("default outline muted icon image"),
    size: axis("default sm"),
  },
  marker: { variant: axis("default separator border") },
  alert: { variant: axis("default destructive") },
  empty: { variant: axis("default icon") },
  "code-block": { variant: axis("default destructive added removed highlighted") },
};
const CVA_KNOBS = {
  button: {
    shadow: { type: "enum", values: ["none", "sm"], default: "none" },
    fontWeight: { type: "enum", values: ["normal", "medium", "semibold"], default: "medium" },
  },
};

// React 19 hoists and de-duplicates these, so keyframes ship with the component.
const style = (id, css) => `<style href="${id}" precedence="medium">{${JSON.stringify(css)}}</style>`;
const before = (marker, element) => [marker, `${element}\n      ${marker}`];

const PATCHES = {
    button: [
    ["bg-destructive text-white", "bg-destructive text-destructive-foreground"],
    ['link: "text-primary underline-offset-4 hover:underline",',
      'link: "text-primary underline-offset-4 hover:underline",\n        brand: "bg-brand text-brand-foreground hover:bg-brand/90",'],
    ["text-sm font-medium whitespace-nowrap", "text-sm whitespace-nowrap"],
    ["    variants: {\n      variant: {",
      '    variants: {\n      shadow: { none: "", sm: "shadow-sm" },\n      fontWeight: { normal: "font-normal", medium: "font-medium", semibold: "font-semibold" },\n      variant: {'],
    ['      size: "default",\n    },\n  }',
      '      size: "default",\n      shadow: "none",\n      fontWeight: "medium",\n    },\n  }'],
    ['  variant = "default",\n  size = "default",\n  asChild', "  variant,\n  size,\n  asChild"],
  ],
  slider: [["key={index}", 'key={index}\n          aria-label={props["aria-label"]}']],
  stepper: [["bg-gradient-to-r from-brand-from to-brand-to", "bg-brand"]],
  "stateful-button": [["data-[state=error]:text-white", "data-[state=error]:text-destructive-foreground"]],
  "shimmer-button": [
    ["rgba(255,255,255,0.35)", "color-mix(in_oklab,var(--primary-foreground)_35%,transparent)"],
    ["animate-shimmer", "animate-[arche-shimmer_2.5s_linear_infinite]"],
    before('<span className="relative z-10 inline-flex items-center gap-2">',
      style("arche-shimmer", "@keyframes arche-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}")),
  ],
  "rainbow-button": [
    ["animate-rainbow", "animate-[arche-rainbow_var(--rainbow-duration,4s)_linear_infinite]"],
    ["      {children}\n    </button>", `      ${style("arche-rainbow", "@keyframes arche-rainbow{from{background-position:0% 50%}to{background-position:200% 50%}}")}\n      {children}\n    </button>`],
  ],
  "ripple-button": [
    ["animate-ripple", "animate-[arche-ripple_600ms_ease-out_forwards]"],
    before('<span className="relative z-10">{children}</span>',
      style("arche-ripple", "@keyframes arche-ripple{from{transform:scale(0);opacity:.35}to{transform:scale(1);opacity:0}}")),
  ],
  "pulsating-button": [
    ['distance = "8px",', 'distance = "0.5rem",'],
    ['"animate-pulse" : "animate-pulse-ripple"', '"animate-[arche-pulse_var(--duration)_ease-out_infinite]" : "animate-[arche-pulse-ripple_var(--duration)_cubic-bezier(0.16,1,0.3,1)_infinite]"'],
    before('<span className="relative z-10">{children}</span>', style("arche-pulse",
      "@keyframes arche-pulse{0%,100%{box-shadow:0 0 0 0 var(--pulse-color,color-mix(in oklab,var(--bg) 50%,transparent))}50%{box-shadow:0 0 0 var(--distance) var(--pulse-color,color-mix(in oklab,var(--bg) 50%,transparent))}}@keyframes arche-pulse-ripple{0%{box-shadow:0 0 0 0 var(--pulse-color,var(--bg))}100%{box-shadow:0 0 0 var(--distance) transparent}}")),
  ],
  confetti: [
    ['const defaultColors = ["#8b5cf6", "#d946ef", "#22d3ee", "#fbbf24", "#34d399"];',
      'const tokenColors = (source: Element) => {\n  const styles = getComputedStyle(source);\n  return ["--primary", "--brand", "--accent", "--chart-1", "--chart-2"].map((name) => styles.getPropertyValue(name).trim());\n};'],
    ["  colors?: string[];\n", "  colors?: string[];\n  /** Element whose theme tokens colour the burst */\n  source?: Element;\n"],
    ["  colors = defaultColors,\n", "  source = document.documentElement,\n  colors = tokenColors(source),\n"],
    [/confettiBurst\(\{(\s+)x: rect/, "confettiBurst({$1source: e.currentTarget,$1x: rect"],
    ["confettiBurst({ x: e.clientX", "confettiBurst({ source: e.currentTarget, x: e.clientX"],
    // noUncheckedIndexedAccess: colors[] may be undefined.
    ['color: colors[Math.floor(Math.random() * colors.length)],', 'color: colors[Math.floor(Math.random() * colors.length)] ?? (colors[0] as string),'],
  ],
  "cool-mode": [
    ["`hsl(${Math.random() * 360}, 70%, 50%)`", 'getComputedStyle(element).getPropertyValue("--chart-" + (1 + Math.floor(Math.random() * 5))).trim()'],
    // noUncheckedIndexedAccess: sizes[] may be undefined; touch coords may be missing.
    ['options?.size || sizes[Math.floor(Math.random() * sizes.length)]', 'options?.size || sizes[Math.floor(Math.random() * sizes.length)] || 25'],
    ['mouseX = e.touches?.[0].clientX', 'mouseX = e.touches?.[0]?.clientX ?? 0'],
    ['mouseY = e.touches?.[0].clientY', 'mouseY = e.touches?.[0]?.clientY ?? 0'],
  ],
  "animated-tooltip": [
    [/const gradients = \[[\s\S]*?\];/, 'const gradients = [\n  "bg-primary text-primary-foreground",\n  "bg-secondary text-secondary-foreground",\n  "bg-accent text-accent-foreground",\n  "bg-brand text-brand-foreground",\n  "bg-muted text-foreground",\n];'],
    ["bg-gradient-to-br ", ""],
    ["text-white ", ""],
  ],
  "hero-video-dialog": [
    ["fill-white text-white", "fill-primary-foreground text-primary-foreground"],
    ["border-2 border-white", "border-2 border-background"],
    ["bg-neutral-900/50 p-2 text-xl text-white", "bg-foreground/50 p-2 text-xl text-background"],
    [" dark:bg-neutral-100/50 dark:text-black", ""],
    ["rgb(0 0 0 / 0.07)", "color-mix(in oklab, var(--foreground) 7%, transparent)"],
    ["rgb(0 0 0 / 0.06)", "color-mix(in oklab, var(--foreground) 6%, transparent)"],
  ],
  "shiny-button": [
    ["text-[rgb(0,0,0,65%)]", "text-foreground/65"],
    [" dark:text-[rgb(255,255,255,90%)]", ""],
    ["var(--primary)/10%_0%", "color-mix(in_oklab,var(--primary)_10%,transparent)_0%"],
    ["dark:hover:shadow-[0_0_20px_var(--primary)/10%]", "dark:hover:shadow-lg"],
    ["rgb(0,0,0)", "var(--foreground)"],
    [/var\(--primary\)\/(\d+)% calc/g, "color-mix(in oklab, var(--primary) $1%, transparent) calc"],
  ],
  // Overlay contents portal into the editor preview tree (themed tokens apply).
  // Each Content accepts an optional portal container; default document.body.
  "alert-dialog": [
    ['  size = "default",\n  ...props\n}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {\n  size?: "default" | "sm"\n}) {', '  size = "default",\n  container,\n  ...props\n}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {\n  size?: "default" | "sm"\n  container?: HTMLElement | null\n}) {'],
    ['    <AlertDialogPortal>', '    <AlertDialogPortal container={container ?? undefined}>'],
  ],
  "context-menu": [
    ['function ContextMenuContent({\n  className,\n  ...props\n}: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {', 'function ContextMenuContent({\n  className,\n  container,\n  ...props\n}: React.ComponentProps<typeof ContextMenuPrimitive.Content> & { container?: HTMLElement | null }) {'],
    ['    <ContextMenuPrimitive.Portal>', '    <ContextMenuPrimitive.Portal container={container ?? undefined}>'],
  ],
  "dialog": [
    ['  showCloseButton = true,\n  ...props\n}: React.ComponentProps<typeof DialogPrimitive.Content> & {\n  showCloseButton?: boolean\n}) {', '  showCloseButton = true,\n  container,\n  ...props\n}: React.ComponentProps<typeof DialogPrimitive.Content> & {\n  showCloseButton?: boolean\n  container?: HTMLElement | null\n}) {'],
    ['    <DialogPortal data-slot="dialog-portal">', '    <DialogPortal data-slot="dialog-portal" container={container ?? undefined}>'],
  ],
  "drawer": [
    ['function DrawerContent({\n  className,\n  children,\n  ...props\n}: React.ComponentProps<typeof DrawerPrimitive.Content>) {', 'function DrawerContent({\n  className,\n  children,\n  container,\n  ...props\n}: React.ComponentProps<typeof DrawerPrimitive.Content> & { container?: HTMLElement | null }) {'],
    ['    <DrawerPortal data-slot="drawer-portal">', '    <DrawerPortal data-slot="drawer-portal" container={container ?? undefined}>'],
  ],
  "dropdown-menu": [
    ['  sideOffset = 4,\n  ...props\n}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {', '  sideOffset = 4,\n  container,\n  ...props\n}: React.ComponentProps<typeof DropdownMenuPrimitive.Content> & { container?: HTMLElement | null }) {'],
    ['    <DropdownMenuPrimitive.Portal>', '    <DropdownMenuPrimitive.Portal container={container ?? undefined}>'],
  ],
  "hover-card": [
    ['  sideOffset = 4,\n  ...props\n}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {', '  sideOffset = 4,\n  container,\n  ...props\n}: React.ComponentProps<typeof HoverCardPrimitive.Content> & { container?: HTMLElement | null }) {'],
    ['    <HoverCardPrimitive.Portal data-slot="hover-card-portal">', '    <HoverCardPrimitive.Portal data-slot="hover-card-portal" container={container ?? undefined}>'],
  ],
  "menubar": [
    ['  sideOffset = 8,\n  ...props\n}: React.ComponentProps<typeof MenubarPrimitive.Content>) {', '  sideOffset = 8,\n  container,\n  ...props\n}: React.ComponentProps<typeof MenubarPrimitive.Content> & { container?: HTMLElement | null }) {'],
    ['    <MenubarPortal>', '    <MenubarPortal container={container ?? undefined}>'],
  ],
  "popover": [
    ['  sideOffset = 4,\n  ...props\n}: React.ComponentProps<typeof PopoverPrimitive.Content>) {', '  sideOffset = 4,\n  container,\n  ...props\n}: React.ComponentProps<typeof PopoverPrimitive.Content> & { container?: HTMLElement | null }) {'],
    ['    <PopoverPrimitive.Portal>', '    <PopoverPrimitive.Portal container={container ?? undefined}>'],
  ],
  "select": [
    ['  align = "center",\n  ...props\n}: React.ComponentProps<typeof SelectPrimitive.Content>) {', '  align = "center",\n  container,\n  ...props\n}: React.ComponentProps<typeof SelectPrimitive.Content> & { container?: HTMLElement | null }) {'],
    ['    <SelectPrimitive.Portal>', '    <SelectPrimitive.Portal container={container ?? undefined}>'],
  ],
  sheet: [
    ['  showCloseButton = true,\n  ...props\n}: React.ComponentProps<typeof SheetPrimitive.Content> & {\n  side?:', '  showCloseButton = true,\n  container,\n  ...props\n}: React.ComponentProps<typeof SheetPrimitive.Content> & {\n  container?: HTMLElement | null\n  side?:'],
    ['    <SheetPortal>', '    <SheetPortal container={container ?? undefined}>'],
  ],
  "tooltip": [
    ['  children,\n  ...props\n}: React.ComponentProps<typeof TooltipPrimitive.Content>) {', '  children,\n  container,\n  ...props\n}: React.ComponentProps<typeof TooltipPrimitive.Content> & { container?: HTMLElement | null }) {'],
    ['    <TooltipPrimitive.Portal>', '    <TooltipPrimitive.Portal container={container ?? undefined}>'],
  ],
  attachment: [
    // Root cva has JS prop defaults but no defaultVariants block, so the
    // emitter could not stamp it. Add the block; values match the JS defaults.
    ['vertical: "w-24 flex-col has-data-[slot=attachment-content]:w-30",\n      },\n    },\n  }\n)', 'vertical: "w-24 flex-col has-data-[slot=attachment-content]:w-30",\n      },\n    },\n    defaultVariants: {\n      size: "default",\n      orientation: "horizontal",\n    },\n  }\n)'],
  ],
  input: [
    ['import { cn } from "cn"', 'import { cva, type VariantProps } from "class-variance-authority"\nimport { cn } from "cn"'],
    ['function Input({ className, type, ...props }: React.ComponentProps<"input">) {', 'const inputVariants = cva("w-full min-w-0", { variants: { controlSize: { sm: "h-8 text-xs", default: "h-9 text-sm", lg: "h-10 text-base" } }, defaultVariants: { controlSize: "default" } })\nfunction Input({ className, type, controlSize, ...props }: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {'],
    ['className={cn(\n        "h-9 w-full min-w-0 rounded-md', 'className={cn(inputVariants({ controlSize }),\n        "w-full min-w-0 rounded-md'],
    ['export { Input }', 'export { Input, inputVariants }'],
  ],
  questionnaire: [
    ['import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"', 'import { CheckIcon } from "lucide-react"'],
    ["<IconPlaceholder", "<CheckIcon"],
    [/\s+(?:lucide|tabler|hugeicons|phosphor|remixicon)="[^"]*"/g, ""],
  ],
  marker: [
    // Variant cva has JS prop defaults but no defaultVariants block.
    ['        border: "border-b border-border pb-2",\n      },\n    },\n  }\n)', '        border: "border-b border-border pb-2",\n      },\n    },\n    defaultVariants: {\n      variant: "default",\n    },\n  }\n)'],
  ],
  "code-block": [
    ['import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"', 'import { Check as CheckIcon, Copy as CopyIcon } from "lucide-react"'],
    [/<IconPlaceholder[\s\S]*?lucide="CheckIcon"[\s\S]*?\/>/, "<CheckIcon />"],
    [/<IconPlaceholder[\s\S]*?lucide="CopyIcon"[\s\S]*?\/>/, "<CopyIcon />"],
  ],
  trace: [
    ['import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"', 'import { ChevronRight as ChevronRightIcon } from "lucide-react"'],
    [/<IconPlaceholder[\s\S]*?\/>/, "<ChevronRightIcon />"],
  ],
  sidebar: [
    // use-mobile is a hook file, not an emittable component: inline it.
    ['import { useIsMobile } from "@/registry/new-york-v4/hooks/use-mobile"', 'const MOBILE_BREAKPOINT = 768\nfunction useIsMobile() {\n  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)\n  React.useEffect(() => {\n    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)\n    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)\n    mql.addEventListener("change", onChange)\n    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)\n    return () => mql.removeEventListener("change", onChange)\n  }, [])\n  return !!isMobile\n}'],
  ],
  "animated-beam": [
    ['gradientStartColor = "#8b5cf6"', 'gradientStartColor = "var(--brand)"'],
    ['gradientStopColor = "#22d3ee"', 'gradientStopColor = "var(--brand-foreground)"'],
  ],
  "aurora-text": [
    ['colors = ["#FF0080", "#7928CA", "#0070F3", "#38bdf8"],', 'colors = ["var(--brand)", "color-mix(in oklab, var(--brand) 75%, var(--primary))", "color-mix(in oklab, var(--brand) 75%, var(--chart-3))", "var(--brand-foreground)"],'],
  ],
  "dia-text-reveal": [
    ['const DEFAULT_COLORS = ["#c679c4", "#fa3d1d", "#ffb005", "#e1e1fe", "#0358f7"]', 'const DEFAULT_COLORS = ["var(--brand)", "color-mix(in oklab, var(--brand) 75%, var(--primary))", "color-mix(in oklab, var(--brand) 75%, var(--chart-3))", "var(--brand)", "var(--foreground)"]'],
  ],
  "code-comparison": [
    ['highlightColor = "#ff3333"', 'highlightColor = "var(--destructive)"'],
  ],
  "comic-text": [
    ['const dotColor = "#EF4444"', 'const dotColor = "var(--destructive)"'],
    ['const backgroundColor = "#FACC15"', 'const backgroundColor = "var(--brand)"'],
    ['`${fontSize * 0.35}px #000000`, // Thick black outline', '`${fontSize * 0.35}px black`,'],
    ['drop-shadow(5px 5px 0px #000000)', 'drop-shadow(5px 5px 0px black)'],
  ],
  "dither-field": [
    ['context.fillStyle = "#808080"', 'context.fillStyle = "gray"'],
    // strictness: noUncheckedIndexedAccess assertions.
    ['  setRamp: (ramp: Rgba[]) => void', '  setRamp: (ramp: [Rgba, Rgba, Rgba]) => void'],
    ['        fieldView[0],', '        fieldView[0]!,'], // multi-line hunk
    ['        fieldView[1],', '        fieldView[1]!,'], // multi-line hunk
    ['    setRamp([low, mid, high]) {', '    setRamp([low, mid, high]: [Rgba, Rgba, Rgba]) {'],
    ['      gl.uniform2f(at(field, "uSize"), css[0], css[1])', '      gl.uniform2f(at(field, "uSize"), css[0]!, css[1]!)'], // multi-line hunk
    ['      gl.uniform2f(at(field, "uView"), fieldView[0], fieldView[1])', '      gl.uniform2f(at(field, "uView"), fieldView[0]!, fieldView[1]!)'], // multi-line hunk
    ['      gl.viewport(0, 0, fieldView[0], fieldView[1])', '      gl.viewport(0, 0, fieldView[0]!, fieldView[1]!)'],
    ['      gl.uniform2f(at(dither, "uView"), view[0], view[1])', '      gl.uniform2f(at(dither, "uView"), view[0]!, view[1]!)'], // multi-line hunk
    ['      gl.uniform1f(at(dither, "uDot"), css[0] / view[0])', '      gl.uniform1f(at(dither, "uDot"), css[0]! / view[0]!)'], // multi-line hunk
    ['      gl.viewport(0, 0, view[0], view[1])', '      gl.viewport(0, 0, view[0]!, view[1]!)'],
    ['const toRamp = (color: DitherColor) =>', 'const toRamp = (color: DitherColor): [string, string, string] =>'], // multi-line hunk
    ['  typeof color === "string" ? [color, color, color] : [...color]', '  (typeof color === "string" ? [color, color, color] : [...color]) as [string, string, string]'], // multi-line hunk
    ['function resolveRamp(host: HTMLElement, color: DitherColor): Rgba[] {', 'function resolveRamp(host: HTMLElement, color: DitherColor): [Rgba, Rgba, Rgba] {'],
    ['    if (!context) return [0.5, 0.5, 0.5, fades[index]]', '    if (!context) return [0.5, 0.5, 0.5, fades[index]!]'],
    ['    return [r / 255, g / 255, b / 255, (a / 255) * fades[index]]', '    return [r!/255, g!/255, b!/255, (a!/255) * fades[index]!]'],
    ['  return ramp', '  return ramp as [Rgba, Rgba, Rgba]'],
    ['      ([entry]) => setNear(entry.isIntersecting),', '      ([entry]) => setNear(entry!.isIntersecting),'],
  ],
  "dotted-map": [
    ['markerColor = "#FF6900"', 'markerColor = "var(--brand)"'],
  ],
  "floating-3d-particles": [
    ['* On mobile screens (< 768px), particle count automatically scales down', '* On mobile screens (< 48rem), particle count automatically scales down'],
    ['* @default "#8B5CF6"', '* @default "var(--brand)"'],
    ['  color = "#8B5CF6",', '  color = "var(--brand)",'],
    ['* Particle color — 3 or 6 digit hex string.', '* Particle color — any CSS color; var() tokens resolve against the document.'],
    [`function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "").trim()
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean

  if (!/^[0-9a-f]{6}$/i.test(full)) return \`rgba(139,92,246,\${alpha})\`

  const n = Number.parseInt(full, 16)
  return \`rgba(\${(n >> 16) & 0xff},\${(n >> 8) & 0xff},\${n & 0xff},\${alpha})\`
}`, `function hexToRgba(hex: string, alpha: number) {
  const token = hex.match(/^var\\((--[\\w-]+)\\)$/)
  const resolved =
    token && typeof document !== "undefined"
      ? getComputedStyle(document.documentElement).getPropertyValue(token[1] ?? "").trim() || hex
      : hex
  const clean = resolved.replace("#", "").trim()
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean

  if (/^[0-9a-f]{6}$/i.test(full)) {
    const n = Number.parseInt(full, 16)
    return \`rgba(\${(n >> 16) & 0xff},\${(n >> 8) & 0xff},\${n & 0xff},\${alpha})\`
  }

  // Named colors, oklch()/rgb() and friends resolve through a probe canvas.
  const probe = document.createElement("canvas")
  const probeCtx = probe.getContext("2d")
  if (!probeCtx) return \`rgba(139,92,246,\${alpha})\`
  probeCtx.fillStyle = "black"
  probeCtx.fillStyle = resolved
  probeCtx.fillRect(0, 0, 1, 1)
  const [r, g, b] = probeCtx.getImageData(0, 0, 1, 1).data
  return \`rgba(\${r},\${g},\${b},\${alpha})\`
}`],
    // strictness: noUncheckedIndexedAccess assertions.
    ['      ? getComputedStyle(document.documentElement).getPropertyValue(token[1] ?? "").trim() || hex', '      ? getComputedStyle(document.documentElement).getPropertyValue(token[1]!).trim() || hex'],
  ],
  "glare-hover": [
    ['* Optional CSS width on the root element (e.g. `"100%"`, `"320px"`).', '* Optional CSS width on the root element (e.g. `"100%"`).'],
    ['* Optional CSS height on the root element (e.g. `"auto"`, `"200px"`).', '* Optional CSS height on the root element (e.g. `"auto"`).'],
    ['   * <GlareHover height="200px">...</GlareHover>', '   * <GlareHover height="12rem">...</GlareHover>'],
    ['   * <GlareHover background="#0a0a0a">...</GlareHover>', '   * <GlareHover background="black">...</GlareHover>'],
    ['   * Glare highlight as `#rrggbb` or `#rgb`; parsed to `rgba` for the gradient.', '   * Glare highlight as any CSS color; hex parses to `rgba`, anything else uses `color-mix`.'],
    ['   * <GlareHover color="#a78bfa">...</GlareHover>', '   * <GlareHover color="var(--brand)">...</GlareHover>'],
    ['   * <GlareHover color="#ffffff" opacity={0.35}>...</GlareHover>', '   * <GlareHover color="white" opacity={0.35}>...</GlareHover>'],
    ['type Color = `#${string}`', 'type Color = string'],
    ['type RGBA = `rgba(${number},${number},${number},${number})`\n', ''],
    [`function parseHEX(color: Color, opacity: number): RGBA | Color {
  const hex = color.replace("#", "")
  const parse = (h: string) => Number.parseInt(h, 16)
  if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return \`rgba(\${parse(hex.slice(0, 2))},\${parse(hex.slice(2, 4))},\${parse(hex.slice(4, 6))},\${opacity})\`
  }
  if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    return \`rgba(\${parse(hex[0] + hex[0])},\${parse(hex[1] + hex[1])},\${parse(hex[2] + hex[2])},\${opacity})\`
  }

  return color
}`, `function parseHEX(color: Color, opacity: number): string {
  if (color.startsWith("#")) {
    const hex = color.replace("#", "")
    const parse = (h: string) => Number.parseInt(h, 16)
    if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return \`rgba(\${parse(hex.slice(0, 2))},\${parse(hex.slice(2, 4))},\${parse(hex.slice(4, 6))},\${opacity})\`
    }
    if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
      return \`rgba(\${parse(hex[0] + hex[0])},\${parse(hex[1] + hex[1])},\${parse(hex[2] + hex[2])},\${opacity})\`
    }
  }
  // Keywords, var() and color() inputs keep full fidelity via color-mix.
  return \`color-mix(in srgb, \${color} \${Math.round(opacity * 100)}%, transparent)\`
}`],
    ['  background = "#000",', '  background = "black",'],
    ['  color = "#ffffff",', '  color = "white",'],
    // strictness: noUncheckedIndexedAccess assertions.
    ['      return `rgba(${parse(hex[0] + hex[0])},${parse(hex[1] + hex[1])},${parse(hex[2] + hex[2])},${opacity})`', '      return `rgba(${parse(hex[0]! + hex[0]!)},${parse(hex[1]! + hex[1]!)},${parse(hex[2]! + hex![2])},${opacity})`'],
  ],
  "glyph-matrix": [
    ['  color = "#6B7280",', '  color = "var(--muted-foreground)",'],
    ['  // animation. Defaults to #6B7280.', '  // animation. Defaults to the muted foreground token.'],
    ['    probeCtx.fillStyle = "#6B7280"', '    probeCtx.fillStyle = "rgb(107, 114, 128)"'],
    [`    // Seed with the default so an invalid color falls back to it: the 2d
    // context keeps the previous fillStyle when assigned an invalid value
    // instead of silently turning black.`, `    // Seed with the default so an invalid color falls back to it: the 2d
    // context keeps the previous fillStyle when assigned an invalid value
    // instead of silently turning black. var() has no custom property
    // context on a detached canvas, so resolve it against the document.`],
    [`    probeCtx.fillStyle = color`, `    probeCtx.fillStyle = resolveProbeColor(color)`],
    [`function GlyphMatrix({`, `function resolveProbeColor(color: string): string {
  const token = color.match(/^var\\((--[\\w-]+)\\)$/)
  if (!token || typeof document === "undefined") return color
  return getComputedStyle(document.documentElement).getPropertyValue(token[1] ?? "").trim() || color
}

function GlyphMatrix({`],
    // strictness: noUncheckedIndexedAccess assertions.
    ['  return getComputedStyle(document.documentElement).getPropertyValue(token[1] ?? "").trim() || color', '  return getComputedStyle(document.documentElement).getPropertyValue(token[1]!).trim() || color'],
    ['    const [r, g, b, a] = probeCtx.getImageData(0, 0, 1, 1).data', '    const [r = 0, g = 0, b = 0, a = 255] = probeCtx.getImageData(0, 0, 1, 1).data'],
    ['      cells = new Array(cols * rows)\n        .fill(0)\n        .map(() => glyphs[Math.floor(Math.random() * glyphs.length)])', '      cells = new Array(cols * rows)\n        .fill(0)\n        .map(() => glyphs[Math.floor(Math.random() * glyphs.length)]!)'],
    ['          const a = alphas[i] * fade * colorAlpha', '          const a = alphas[i]! * fade * colorAlpha'],
    ['          ctx.fillText(cells[i], x * cellSize, y * cellSize)', '          ctx.fillText(cells[i]!, x * cellSize, y * cellSize)'],
    ['          cells[i] = glyphs[Math.floor(Math.random() * glyphs.length)]', '          cells[i] = glyphs[Math.floor(Math.random() * glyphs.length)]!'],
  ],
  "icon-cloud": [
    ['    if (canvas && ctx) {', '    if (canvas && ctx) {\n      const accent = getComputedStyle(canvas).getPropertyValue("--brand").trim() || "blue"'],
    ['            ctx.fillStyle = "#4444ff"', '            ctx.fillStyle = accent'],
  ],
  "magic-card": [
    ['    gradientColor = "#262626",', '    gradientColor = "var(--brand)",'],
    ['    gradientFrom = "#9E7AFF",', '    gradientFrom = "var(--brand)",'],
    ['    gradientTo = "#FE8BBB",', '    gradientTo = "color-mix(in oklab, var(--brand) 75%, var(--chart-3))",'],
    ['  const glowFrom = isOrbMode(props) ? (props.glowFrom ?? "#ee4f27") : "#ee4f27"', '  const glowFrom = isOrbMode(props) ? (props.glowFrom ?? "var(--brand)") : "var(--brand)"'],
    ['  const glowTo = isOrbMode(props) ? (props.glowTo ?? "#6b21ef") : "#6b21ef"', '  const glowTo = isOrbMode(props) ? (props.glowTo ?? "color-mix(in oklab, var(--brand) 75%, var(--primary))") : "color-mix(in oklab, var(--brand) 75%, var(--primary))"'],
  ],
  "neon-gradient-card": [
    ['   * @default "{ firstColor: \'#ff00aa\', secondColor: \'#00FFF1\' }"', '   * @default brand gradient stops'],
    ['    firstColor: "#ff00aa",', '    firstColor: "var(--brand)",'],
    ['    secondColor: "#00FFF1",', '    secondColor: "var(--brand-foreground)",'],
  ],
  "shooting-stars": [
    ['function rgb(el: Element, color: string) {', 'function channels(el: Element, color: string) {'],
    ['      const fg = `rgb(${rgb(el, getComputedStyle(el).color)})`;', '      const fg = `rgb(${channels(el, getComputedStyle(el).color)})`;'],
    ['      const brand = `rgb(${rgb(el, "--brand-via")})`;', '      const brand = `rgb(${channels(el, "--brand-via")})`;'],
    ['      const c = rgb(el, color);', '      const c = channels(el, color);'],
    // strictness: noUncheckedIndexedAccess assertions.
    ['      seen = e.isIntersecting;', '      seen = e!.isIntersecting;'],
    ['        const l = Math.min(length, d);', '        const l = Math.min(length, d!);'], // multi-line hunk
    ['        const x = x0 + dx * d;', '        const x = x0! + dx! * d!;'], // multi-line hunk
    ['        const y = y0 + dy * d;', '        const y = y0! + dy! * d!;'], // multi-line hunk
    ['        const tx = x - dx * l;', '        const tx = x - dx! * l;'], // multi-line hunk
    ['        const ty = y - dy * l;', '        const ty = y - dy! * l;'], // multi-line hunk
    ['          streaks[i][5] += streaks[i][4] * dt;', '          streaks[i]![5]! += streaks[i]![4]! * dt;'], // multi-line hunk
    ['          if (paint(streaks[i])) streaks.splice(i, 1);', '          if (paint(streaks[i]!)) streaks.splice(i, 1);'], // multi-line hunk
  ],
  "shine-border": [
    ['   * @default "#000000"', '   * @default "black"'],
    ['  shineColor = "#000000",', '  shineColor = "black",'],
  ],
  loaders: [
    ['/** Overall size: sm = 16px, md = 24px, lg = 32px */', '/** Overall size: sm, md, lg (text scales with the size prop) */'],
  ],
  "animated-testimonials": [
    ['{/* Each 24px button is the hit area; the pill inside is visual. */}', '{/* Each button is the hit area; the pill inside is visual. */}'],
    // strictness: noUncheckedIndexedAccess assertions.
    ['            {active.src ? (', '            {active!.src ? ('],
    ['                src={active.src}', '                src={active!.src}'], // multi-line hunk
    ['                alt={active.name}', '                alt={active!.name}'], // multi-line hunk
    ['                {initials(active.name)}', '                {initials(active!.name)}'],
    ['              &ldquo;{active.quote}&rdquo;', '              &ldquo;{active!.quote}&rdquo;'],
    ['              <span className="font-medium text-foreground">{active.name}</span>', '              <span className="font-medium text-foreground">{active!.name}</span>'],
    ['              {active.role}', '              {active!.role}'],
  ],
  "moving-border": [
    ['opposite corners, showing through the same 1px gap. */}', 'opposite corners, showing through the same hairline gap. */}'],
  ],
  "data-grid": [
    // Curated SelectTrigger has no size prop; sm maps to h-8 exactly.
    ['<SelectTrigger\n                size="sm"\n                aria-label="Rows per page"\n                className="w-[4.5rem]"', '<SelectTrigger\n                aria-label="Rows per page"\n                className="h-8 w-[4.5rem]"'],
  ],
  "3d-marquee": [
    // images[i] is provably in range, but the index signature says otherwise.
    ['const { src, alt = "" } = typeof image === "string" ? { src: image } : image;', 'const { src, alt = "" } = (typeof image === "string" ? { src: image } : image) ?? { src: "" };'],
    // strictness: noUncheckedIndexedAccess assertions.
    ['      el.toggleAttribute("data-offscreen", !e.isIntersecting)', '      el.toggleAttribute("data-offscreen", !e!.isIntersecting)'],
  ],
  "pixel-image": [
    // customGrid validated, DEFAULT_GRIDS[grid] needs a fallback for the index signature.
    ['    return isValidGrid(customGrid) ? customGrid! : DEFAULT_GRIDS[grid]\n  }, [customGrid, grid])', '    return (isValidGrid(customGrid) ? customGrid : DEFAULT_GRIDS[grid]) ?? { rows: 4, cols: 6 }\n  }, [customGrid, grid])'],
    // strictness: noUncheckedIndexedAccess assertions.
    ['      const delay = delaySeeds[index] * maxAnimationDelay', '      const delay = delaySeeds[index]! * maxAnimationDelay'],
  ],
  "apple-cards-carousel": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['        (event.shiftKey ? last : first).focus();', '        (event.shiftKey ? last! : first!).focus();'],
  ],
  "background-boxes": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['            cell.style.setProperty("--tint", TINTS[(Math.random() * TINTS.length) | 0]);', '            cell.style.setProperty("--tint", TINTS[(Math.random() * TINTS.length) | 0]!);'],
  ],
  "direction-aware-hover": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['    return (["right", "bottom", "left", "top"] as const)[quadrant];', '    return (["right", "bottom", "left", "top"] as const)[quadrant]!;'],
  ],
  "dotted-glow-background": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['      const b = rgb(cs.getPropertyValue("--brand") || cs.color);', '      const b = rgb(cs.getPropertyValue("--brand") || cs.color)!;'],
    ['        return `rgba(${a.map((v, j) => Math.round(v + (b[j] - v) * k))},${opacity + (1 - opacity) * k})`;', '        return `rgba(${a.map((v, j) => Math.round(v + (b[j]! - v) * k))},${opacity + (1 - opacity) * k})`;'],
    ['          for (const [lx, ly] of lights) v += Math.exp(-((x - lx) ** 2 + (y - ly) ** 2) * inv);', '          for (const [lx, ly] of lights) v += Math.exp(-((x - lx!) ** 2 + (y - ly!) ** 2) * inv);'],
    ['          paths[i].moveTo(x + r, y);', '          paths[i]!.moveTo(x + r, y);'], // multi-line hunk
    ['          paths[i].arc(x, y, r, 0, 7);', '          paths[i]!.arc(x, y, r, 0, 7);'], // multi-line hunk
    ['        ctx.fillStyle = styles[i];', '        ctx.fillStyle = styles[i]!;'],
    ['      seen = e.isIntersecting;', '      seen = e!.isIntersecting;'],
  ],
  "expandable-card": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['        last.focus();', '        last!.focus();'],
  ],
  "globe": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['      const w = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));', '      const w = Math.acos(Math.min(1, a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!));'],
    ['        pts.push([a[0] * p + b[0] * q, a[1] * p + b[1] * q, a[2] * p + b[2] * q]);', '        pts.push([a[0]! * p + b[0]! * q, a[1]! * p + b[1]! * q, a[2]! * p + b[2]! * q]);'],
    ['        const [x, y, z] = proj(dots[i], dots[i + 1], dots[i + 2]);', '        const [x, y, z] = proj(dots[i]!, dots[i + 1]!, dots[i + 2]!);'], // multi-line hunk
    ['        if (z <= 0) continue;', '        if (z! <= 0) continue;'], // multi-line hunk
    ['        ctx.globalAlpha = 0.12 + 0.78 * z;', '        ctx.globalAlpha = 0.12 + 0.78 * z!;'], // multi-line hunk
    ['        disc(x, y, r * (0.6 + 0.4 * z));', '        disc(x!, y!, r * (0.6 + 0.4 * z!));'], // multi-line hunk
    ['          const q = proj(p[0], p[1], p[2]);', '          const q = proj(p[0]!, p[1]!, p[2]!);'], // multi-line hunk
    ['          return q[2] > 0 || q[0] * q[0] + q[1] * q[1] > 1 ? q : null;', '          return q[2]! > 0 || q[0]! * q[0]! + q[1]! * q[1]! > 1 ? q : null;'], // multi-line hunk
    ['          ctx.moveTo(cx + a[0] * R, cy - a[1] * R);', '          ctx.moveTo(cx + a[0]! * R, cy - a[1]! * R);'], // multi-line hunk
    ['          ctx.lineTo(cx + b[0] * R, cy - b[1] * R);', '          ctx.lineTo(cx + b[0]! * R, cy - b[1]! * R);'], // multi-line hunk
    ['          disc(tip[0], tip[1], 2.2);', '          disc(tip[0]!, tip[1]!, 2.2);'],
    ['          disc(e[0], e[1], 2);', '          disc(e[0]!, e[1]!, 2);'],
    ['        const [x, y, z] = proj(p[0], p[1], p[2]);', '        const [x, y, z] = proj(p[0]!, p[1]!, p[2]!);'], // multi-line hunk
    ['        if (z <= 0) return;', '        if (z! <= 0) return;'], // multi-line hunk
    ['        const fade = Math.min(1, z * 4);', '        const fade = Math.min(1, z! * 4);'], // multi-line hunk
    ['        disc(x, y, 3);', '        disc(x!, y!, 3);'],
    ['        disc(x, y, 3 + ph * 11);', '        disc(x!, y!, 3 + ph * 11);'],
    ['        const name = markers[k].label;', '        const name = markers[k]!.label;'], // multi-line hunk
    ['        if (name && z > 0.3) {', '        if (name && z! > 0.3) {'], // multi-line hunk
    ['          ctx.globalAlpha = Math.min(1, (z - 0.3) * 4) * 0.85;', '          ctx.globalAlpha = Math.min(1, (z! - 0.3) * 4) * 0.85;'], // multi-line hunk
    ['          ctx.fillText(name, cx + x * R + 8, cy - y * R + 4);', '          ctx.fillText(name, cx + x! * R + 8, cy - y! * R + 4);'],
    ['        v.lng += d[0] * 15;', '        v.lng += d[0]! * 15;'], // multi-line hunk
    ['        v.lat += d[1] * 15;', '        v.lat += d[1]! * 15;'], // multi-line hunk
    ['        v.vx += d[0];', '        v.vx += d[0]!;'], // multi-line hunk
    ['        v.vy += d[1];', '        v.vy += d[1]!;'], // multi-line hunk
    ['      inView = e.isIntersecting;', '      inView = e!.isIntersecting;'],
  ],
  "glowing-effect": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['      listen(entries[entries.length - 1].isIntersecting)', '      listen(entries[entries.length - 1]!.isIntersecting)'],
  ],
  "hexagon-pattern": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['      const key = edgeLexKey(a, b)', '      const key = edgeLexKey(a!, b!)'],
    ['        edges.push([a, b])', '        edges.push([a!, b!])'],
  ],
  "image-slider": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['      inView = e.isIntersecting;', '      inView = e!.isIntersecting;'],
    ['    if (n > 1) new Image().src = images[(index + 1) % n].src;', '    if (n > 1) new Image().src = images[(index + 1) % n]!.src;'],
  ],
  "noise-background": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['      seen = e.isIntersecting;', '      seen = e!.isIntersecting;'],
  ],
  "number-ticker": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['  const isInView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });', '  const isInView = useInView(ref, { once: true, margin: "0% 0% -10% 0%" });'],
  ],
  "scroll-based-velocity": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['        isInViewRef.current = entry.isIntersecting', '        isInViewRef.current = entry!.isIntersecting'],
  ],
  "scroll-velocity": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['      visible = entry.isIntersecting;', '      visible = entry!.isIntersecting;'],
  ],
  "terminal": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });', '  const inView = useInView(ref, { once: true, margin: "0% 0% -15% 0%" });'],
  ],
  "text-3d-flip": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['          delay: (i: number) => delays[i],', '          delay: (i: number) => delays[i]!,'],
    ['              key={charOffsets[wordIndex] + charIndex}', '              key={charOffsets[wordIndex]! + charIndex}'],
  ],
  "typewriter": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['    if (!deleting && text.length < word.length) {', '    if (!deleting && text.length < word!.length) {'], // multi-line hunk
    ['      timeout = setTimeout(() => setText(word.slice(0, text.length + 1)), typeSpeed);', '      timeout = setTimeout(() => setText(word!.slice(0, text.length + 1)), typeSpeed);'], // multi-line hunk
    ['    } else if (!deleting && text.length === word.length) {', '    } else if (!deleting && text.length === word!.length) {'], // multi-line hunk
    ['      timeout = setTimeout(() => setText(word.slice(0, text.length - 1)), deleteSpeed);', '      timeout = setTimeout(() => setText(word!.slice(0, text.length - 1)), deleteSpeed);'],
  ],
  "vortex": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['      seen = e.isIntersecting;', '      seen = e!.isIntersecting;'],
    ['      const glow = fg[0] * 0.3 + fg[1] * 0.59 + fg[2] * 0.11 > 128;', '      const glow = fg[0]! * 0.3 + fg[1]! * 0.59 + fg[2]! * 0.11 > 128;'],
    ['        return `rgb(${[0, 1, 2].map((j) => x[j] + (y[j] - x[j]) * m).join(", ")})`;', '        return `rgb(${[0, 1, 2].map((j) => x![j]! + (y![j]! - x![j]!) * m).join(", ")})`;'],
    ['          ctx.strokeStyle = ramp[p.c];', '          ctx.strokeStyle = ramp[p.c]!;'],
  ],
  "wavy-background": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['      seen = e.isIntersecting;', '      seen = e!.isIntersecting;'],
    ['      ctx.globalCompositeOperation = r * 0.3 + g * 0.59 + b * 0.11 > 128 ? "lighter" : "source-over";', '      ctx.globalCompositeOperation = r! * 0.3 + g! * 0.59 + b! * 0.11 > 128 ? "lighter" : "source-over";'],
    ['            ctx.lineTo(j * step, top[j] + amp * (0.45 + 0.35 * Math.sin(u * f1 * 1.3 - t * s + p)));', '            ctx.lineTo(j * step, top[j]! + amp * (0.45 + 0.35 * Math.sin(u * f1 * 1.3 - t * s + p)));'],
  ],
  "world-map": [
    // strictness: noUncheckedIndexedAccess assertions.
    ['        if (m[o] + m[o + 1] + m[o + 240] + m[o + 241] > 1) dots += `M${x} ${y}h0`;', '        if (m[o]! + m[o + 1]! + m[o + 240]! + m[o + 241]! > 1) dots += `M${x} ${y}h0`;'],
    ['          const lift = Math.hypot(x2 - x1, y2 - y1) * 0.3;', '          const lift = Math.hypot(x2! - x1!, y2! - y1!) * 0.3;'], // multi-line hunk
    ['          const d = `M${x1} ${y1}Q${(x1 + x2) / 2} ${(y1 + y2) / 2 - lift} ${x2} ${y2}`;', '          const d = `M${x1!} ${y1!}Q${(x1! + x2!) / 2} ${(y1! + y2!) / 2 - lift} ${x2!} ${y2!}`;'], // multi-line hunk
    ['            style={{ left: `${((x + 0.5) / 120) * 100}%`, top: `${((y + 0.5) / 48) * 100}%` }}', '            style={{ left: `${((x! + 0.5) / 120) * 100}%`, top: `${((y! + 0.5) / 48) * 100}%` }}'],
  ],
  "draggable-card": [
    // strictness: moves[e.key] is possibly undefined; extract once and narrow.
    ['        if (moves[e.key]) nudge(...moves[e.key]);', '        const move = moves[e.key];\n        if (move) nudge(...move);'],
  ],
};

const cls = (pattern, to) => [new RegExp(`(?<=[\\s"'\`:])${pattern}(?=[\\s"'\`])`, "g"), to];
// Artistic pixel constants become rem (identical rendering, no raw px).
// Skips w-px/h-px/inset-px (no digits) and stroke-[0.5] (no px suffix).
const pxToRem = [/(-?\d*\.?\d+)px(?=[\s"'`\]?,;}_:/)\]]|$)/g, (m, n) => `${Math.round((Number.parseFloat(n) / 16) * 100000) / 100000}rem`];
const GLOBAL = [
  cls("border", "border-(length:--border-width)"),
  cls("border-([trblxy])", "border-$1-(length:--border-width)"),
  cls("border-2", "border-[length:calc(var(--border-width)*2)]"),
  cls("rounded(-[trbl]{1,2})?-2xl", "rounded$1-xl"),
  cls("rounded-(?:xs|\\[4px\\]|\\[2px\\])", "rounded-sm"),
  cls("shadow-xs", "shadow-sm"),
  cls("shadow-2xl", "shadow-xl"),
  cls("shadow", "shadow-sm"),
  cls("duration-(?:100|150)", "duration-(--motion-fast-duration)"),
  cls("duration-(?:200|300|500)", "duration-(--motion-normal-duration)"),
  cls("bg-white", "bg-background"),
  [/bg-black\/50/g, "bg-foreground/40"],
  [/h-px bg-border/g, "h-(--border-width) bg-border"],
  [/cn-font-heading/g, "font-display"],
  [/:shimmer\b/g, ":animate-pulse"],
  [/ scroll-fade-x/g, ""],
  [/scrollbar-none/g, "[scrollbar-width:none]"],
  [/ring-\[3px\]/g, "ring-3"],
  [/text-\[10px\]/g, "text-[0.625rem]"],
  [/var\(--radius\)-5px/g, "var(--radius)-0.3125rem"],
  [/_2px\)/g, "_0.125rem)"],
  [/%-2px\)/g, "%-0.125rem)"],
  [/drop-shadow\(0 4px 3px /g, "drop-shadow(0 0.25rem 0.1875rem "],
  [/drop-shadow\(0 2px 2px /g, "drop-shadow(0 0.125rem 0.125rem "],
  [/var\(--brand-from\)/g, "var(--brand)"],
  [/var\(--brand-via\)/g, "color-mix(in_oklab,var(--brand)_75%,var(--primary))"],
  [/var\(--brand-to\)/g, "color-mix(in_oklab,var(--brand)_75%,var(--chart-3))"],
  // Drop-shadow filter scale has no contract token; wire it to --shadow-*.
  [/\bdrop-shadow-(sm|md|lg|xl)(?![\w-])/g, "drop-shadow-[var(--shadow-$1)]"],
  // Device mockup grays track the theme neutrals (near-exact in both modes).
  [/fill-\[#E5E5E5\] dark:fill-\[#404040\]/g, "fill-muted dark:fill-muted"],
  [/fill-\[#F5F5F5\] dark:fill-\[#262626\]/g, "fill-muted dark:fill-card"],
  [/fill-white dark:fill-\[#262626\]/g, "fill-background dark:fill-card"],
  [/fill-\[#E5E5E5\] stroke-\[#E5E5E5\] stroke-\[0\.5\] dark:fill-\[#404040\] dark:stroke-\[#404040\]/g, "fill-muted stroke-muted stroke-[0.5] dark:fill-muted dark:stroke-muted"],
  // SVG presentation attributes cannot use var(); the elements carry no
  // className (verified), so swap the attribute for a token utility.
  [/\sfill="#A3A3A3"/g, ' className="fill-muted-foreground"'],
  // Mask gradients: keyword blacks/whites are not hex.
  [/linear-gradient\(#000,#000\)/g, "linear-gradient(black,black)"],
  [/linear-gradient\(#fff 0 0\) content-box, linear-gradient\(#fff 0 0\)/g, "linear-gradient(white 0 0) content-box, linear-gradient(white 0 0)"],
  [/\[--glow-m:#000\]/g, "[--glow-m:black]"],
  // Recharts ships stroke='#ccc'/'#fff' defaults; theme every such element.
  [/\[stroke='#ccc'\]/g, ""],
  [/\[stroke='#fff'\]/g, ""],
  pxToRem,
];

function edit(source, find, to, slug) {
  const out = typeof find === "string" ? source.split(find).join(to) : source.replace(find, to);
  if (out === source) throw new Error(`${slug}: pattern not found: ${find}`);
  return out;
}

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const pascal = (s) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");

function transform(slug, source) {
  let out = source.replace(/\r\n/g, "\n");
  for (const [find, to] of PATCHES[slug] ?? []) out = edit(out, find, to, slug);
  for (const token of TOKENS[slug] ?? []) {
    const name = `--${slug}-${kebab(token.knob)}`;
    for (const [find, template] of token.edits) {
      const to = template.replaceAll("{p}", `(${name},${token.def})`).replaceAll("{v}", `var(${name},${token.def})`);
      out = edit(out, find, to, slug);
    }
  }
  for (const [find, to] of GLOBAL) out = out.replace(find, to);
  out = out
    .replace(/from "(?:cn|@\/lib\/utils)"/g, 'from "./lib/utils.js"')
    .replace(/from "@\/registry\/[\w-]+\/ui\/([\w-]+)"/g, 'from "./$1.js"')
    .replace(/from "@\/components\/ui\/([\w-]+)"/g, 'from "./$1.js"')
    .replace(/import \{\s*(\w+)(?:\s+as\s+(\w+))?\s*\} from "radix-ui"/g,
      (_, name, alias) => `import * as ${alias ?? name} from "@radix-ui/react-${kebab(name)}"`);
  if (/\bReact\./.test(out) && !/import\s+(?:\*\s+as\s+React|React\b)/.test(out)) {
    const line = 'import type * as React from "react"\n';
    out = /^"use client";?\n/.test(out) ? out.replace(/^("use client";?\n)/, `$1\n${line}`) : line + out;
  }
  return out;
}

const contract = readJson(`${SRC}/contract/token-contract.json`).tokens.map((t) => t.name);
// Doc comments name tokens illustratively; only code references count.
// The negative lookbehind keeps :// and // inside strings (URLs) intact.
const stripComments = (source) => source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(?<!["':/])\/\/[^\n\r]*/g, "");
function tokensUsed(rawSource) {
  const source = stripComments(rawSource);
  return contract.filter((token) => {
    const bare = token.slice(2);
    if (source.includes(`${token})`) || source.includes(`${token},`) || source.includes(`${token}"`) || source.includes(`${token}-duration`)) return true;
    // Only scale-consuming radius utilities count (rounded-md/lg/...); token
    // refs (rounded-(--x,...)), fixed radii (rounded-full) and arbitrary
    // values do not consume the --radius scale.
    // Mirrors the manifest checker's radius rule: bare `rounded` consumes the
    // scale, `rounded-full` and arbitrary values do not. The lookahead keeps
    // `rounded-[...]` token refs for the --name rules below.
    if (token === "--radius") return /\brounded(?:-[tblrse]{1,2})?(?:-(?:sm|md|lg|xl))?(?=[\s"'`:/]|$)/.test(source);
    if (token.startsWith("--shadow") || token.startsWith("--font")) return new RegExp(`\\b${bare}(?![\\w-])`).test(source);
    return new RegExp(`\\b(?:bg|text|border|ring|ring-offset|fill|stroke|from|via|to|outline|shadow)-${bare}(?![\\w-])`).test(source);
  });
}

function buildManifest(slug, title, category, source, old) {
  const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
  const dependencies = [...new Set(imports
    .filter((i) => !i.startsWith(".") && !/^react(-dom)?(\/|$)/.test(i))
    .map((i) => i.split("/").slice(0, i.startsWith("@") ? 2 : 1).join("/")))].sort();
  const registryDependencies = [...new Set(imports
    .filter((i) => i.startsWith("./"))
    .map((i) => path.basename(i, ".js")))].sort();
  const primitivePackage =
    dependencies.find((d) => d.startsWith("@radix-ui/") && d !== "@radix-ui/react-slot") ??
    dependencies.find((d) => ["@base-ui/react", "cmdk", "vaul", "input-otp", "react-day-picker", "@shadcn/react", "@radix-ui/react-slot"].includes(d)) ??
    "react";
  const found = [...new Set([...source.matchAll(/\w*Primitive\.([A-Z]\w*)(?!\.Props)/g)].map((m) => m[1]))];
  const parts = found.length ? found : ["Root"];
  const slotNames = [...new Set(["root", ...[...source.matchAll(/data-slot="([\w-]+)"/g)]
    .map((m) => (m[1] === slug ? "root" : m[1].replace(`${slug}-`, "")))])];
  const [description, useWhen, avoid] = META[slug].split("|");
    const knobs = {
    ...CVA_KNOBS[slug],
    ...Object.fromEntries((TOKENS[slug] ?? []).map((t) => [
      t.knob,
      { type: "enum", values: t.values, default: t.def, cssVar: `--${slug}-${kebab(t.knob)}` },
    ])),
  };
  return {
    name: slug,
    title,
    description: old?.description ?? description,
    category: old?.category ?? category,
    manifestVersion: 1,
    primitive: { package: primitivePackage, parts, propsInherited: true },
    slots: slotNames.map((name) => ({
      name,
      part: parts.includes(pascal(name)) ? pascal(name) : parts[0],
      required: name === "root",
    })),
    axes: AXES[slug] ?? {},
    styleSurface: Object.keys(knobs).length ? { root: knobs } : {},
    tokensUsed: tokensUsed(source),
    dependencies,
    registryDependencies,
    files: [{ name: slug, source: `src/templates/${slug}.tsx`, target: `components/ui/${slug}.tsx`, type: "registry:ui" }],
    standards: old?.standards ?? {
      purpose: description,
      useWhen: [useWhen],
      doNotUseWhen: [avoid],
      rules: [{ id: `${slug}-accessible-name`, severity: "error", check: "Every interactive control has an accessible name." }],
    },
  };
}

// 1. Transform everything in memory first, so a failure writes nothing.
const manifestPath = (slug) => `${MAN}/${slug}.manifest.json`;
// Slugs excluded:
// - questionnaire / message-scroller: primitive is not an installable npm package.
// - data-table / typography: aggregate entries with no registry source.
// - OLD: curated legacy components; aggregate copies must not overwrite them.
const SKIP = new Set(["questionnaire", "message-scroller", "data-table", "typography", ...OLD]);
const results = new Map();
for (const [group, items] of Object.entries(readJson(catalogPath).sections.Components)) {
  if (!CATEGORY[group]) { console.warn(`Skipping unreviewed category: ${group}`); continue; }
  for (const item of items) {
    const slug = item.registry?.name ?? item.name.toLowerCase().replaceAll(" ", "-");
    if (SKIP.has(slug)) continue;
    const source = item.registry
      ? transform(slug, item.registry.files[0].content)
      : fs.readFileSync(`${TPL}/${slug}.tsx`, "utf8");
    const old = fs.existsSync(manifestPath(slug)) ? readJson(manifestPath(slug)) : undefined;
    // Duplicate slugs in the aggregate (grid-pattern ships twice): first wins.
    if (results.has(slug)) { console.warn(`${slug}: duplicate aggregate entry skipped`); continue; }
    results.set(slug, { source, manifest: buildManifest(slug, item.name, CATEGORY[group], source, old) });
  }
}

// 2. Keep old components still needed by blocks or by new components.
const BLOCKS = `${SRC}/blocks`;
const blockDeps = fs.readdirSync(BLOCKS).flatMap((file) => {
  if (file.endsWith(".block.json")) return readJson(`${BLOCKS}/${file}`).registryDependencies ?? [];
  if (file.endsWith(".tsx")) {
    const source = fs.readFileSync(`${BLOCKS}/${file}`, "utf8");
    return [...source.matchAll(/from "\.\.\/templates\/([a-z-]+)\.js"/g)].map((m) => m[1]);
  }
  return [];
});
const queue = [...blockDeps, ...[...results.values()].flatMap((r) => r.manifest.registryDependencies)];
const retained = new Set();

// 3. Write new files and delete unused old ones.
for (const [slug, { source, manifest }] of results) {
  fs.writeFileSync(`${TPL}/${slug}.tsx`, source);
  writeJson(manifestPath(slug), manifest);
  const leftover = source.match(/#[0-9a-f]{6}\b|rgba?\(|hsl\(|-(?:white|black)\b/gi);
  if (leftover) console.warn(`${slug}: hardcoded colours remain: ${leftover.join(", ")}`);
}
// Additive only: legacy components outside reviewed categories stay untouched.
// Deleting them would break blocks and docs that still depend on them.
const removed = [];

// 4. Update fixture selections.
for (const file of fs.readdirSync("fixtures").filter((f) => f.endsWith(".json"))) {
  const payload = readJson(`fixtures/${file}`);
  if (!payload.components || !payload.tokens) continue;
  for (const slug of removed) delete payload.components[slug];
  for (const [slug, { manifest }] of results) {
    payload.components[slug] = Object.fromEntries([
      ...Object.entries(manifest.axes).map(([name, a]) => [name, a.default]),
      ...Object.values(manifest.styleSurface).flatMap((surface) =>
        Object.entries(surface).map(([name, spec]) => [name, spec.default])),
    ]);
  }
  writeJson(`fixtures/${file}`, payload);
}

console.log(`Imported ${results.size}. Removed: ${removed.join(", ")}`);
