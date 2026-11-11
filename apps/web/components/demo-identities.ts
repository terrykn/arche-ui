/** The rotation identities for the homepage transformation story. */
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
  /** Text on the primary color — defaults to white. */
  onPrimary?: string;
  radius: string;
  buttonRadius: string;
  /** Border weight — the whole component system keys off --border-width. */
  borderWidth: string;
  /** Body font stack for the identity. */
  font: string;
}

export const DEMO_IDENTITIES: DemoIdentity[] = [
  {
    name: "Clearwater Dental",
    prompt: "booking app for a dental clinic, calm and soft blue",
    components: 24,
    primary: "#4a90c9",
    accentBg: "#e8f1f9",
    accentText: "#2f6da3",
    background: "#f6fafd",
    ink: "#1c2b3a",
    radius: "20px",
    buttonRadius: "999px",
    borderWidth: "1px",
    font: '"Nunito", ui-rounded, "SF Pro Rounded", system-ui, sans-serif',
  },
  {
    name: "Pixel Vault",
    prompt: "retro game shop for handheld collectors, fun pixel style",
    components: 24,
    primary: "#ffd23f",
    accentBg: "#33255c",
    accentText: "#ffd23f",
    background: "#241b3a",
    surface: "#2e2450",
    ink: "#f7f2ff",
    onPrimary: "#241b3a",
    radius: "4px",
    buttonRadius: "0px",
    borderWidth: "2px",
    font: 'ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace',
  },
  {
    name: "Meridian",
    prompt: "enterprise company with a bold red, bright, and trusted energy",
    components: 30,
    primary: "#d21f2c",
    accentBg: "#fdecec",
    accentText: "#a3121d",
    background: "#ffffff",
    ink: "#16181d",
    radius: "6px",
    buttonRadius: "6px",
    borderWidth: "1px",
    font: 'Georgia, "Times New Roman", serif',
  },
];
