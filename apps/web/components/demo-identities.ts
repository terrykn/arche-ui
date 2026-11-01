/** The six rotation identities (§4 table, values verbatim). */
export interface DemoIdentity {
  name: string;
  prompt: string;
  components: number;
  primary: string;
  accentBg: string;
  accentText: string;
  background: string;
  surface?: string;
  ink: string;
  radius: string;
  buttonRadius: string;
}

export const DEMO_IDENTITIES: DemoIdentity[] = [
  {
    name: "Acme UI",
    prompt: "playful saas, bold violet",
    components: 24,
    primary: "#6d5bd0",
    accentBg: "#efedf7",
    accentText: "#5746b8",
    background: "#f7f6fa",
    ink: "#1b1826",
    radius: "14px",
    buttonRadius: "10px",
  },
  {
    name: "Finch Finance",
    prompt: "quiet luxury fintech, deep teal",
    components: 30,
    primary: "#0f766e",
    accentBg: "#e6f2f0",
    accentText: "#0b5e57",
    background: "#f4f7f6",
    ink: "#14201e",
    radius: "6px",
    buttonRadius: "4px",
  },
  {
    name: "90s Arcade",
    prompt: "90s arcade, neon on midnight",
    components: 30,
    primary: "#e04fa3",
    accentBg: "#2b1e4d",
    accentText: "#7ee8fa",
    background: "#17122b",
    surface: "#221a3f",
    ink: "#f4f0ff",
    radius: "4px",
    buttonRadius: "2px",
  },
  {
    name: "Travel Co",
    prompt: "warm wanderlust, sunset amber",
    components: 18,
    primary: "#c2711d",
    accentBg: "#fbf0dd",
    accentText: "#9a5a12",
    background: "#fbf7ef",
    ink: "#2a1f14",
    radius: "20px",
    buttonRadius: "999px",
  },
  {
    name: "Mono Studio",
    prompt: "minimal monochrome, black & white",
    components: 30,
    primary: "#17171a",
    accentBg: "#f0f0f2",
    accentText: "#17171a",
    background: "#f7f7f8",
    ink: "#17171a",
    radius: "8px",
    buttonRadius: "6px",
  },
  {
    name: "Ancient Greece",
    prompt: "ancient greece, marble & bronze",
    components: 30,
    primary: "#85683f",
    accentBg: "#f0e9db",
    accentText: "#6d5730",
    background: "#f7f5f0",
    ink: "#1c1a16",
    radius: "10px",
    buttonRadius: "6px",
  },
];
