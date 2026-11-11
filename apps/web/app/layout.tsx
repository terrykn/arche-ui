import type { Metadata } from "next";
import "./globals.css";
import "./theme.css";
import "./proto.css";
import "./acme.css";
import { fontSans, fontDisplay, fontMono } from "./fonts.generated";
import { googleFontVariables } from "./google-fonts.generated";

export const metadata: Metadata = {
  title: "Arche UI",
  description: "Generate complete React component libraries with AI, tailored to your brand.",
  icons: {
    icon: [{ url: "/arche_logo.png" }],
  },
};

// Always light mode: no theme cookie, no bootstrap, no toggles.
// Satoshi (display + body) loads only through Fontshare's official CSS API.
const FONTSHARE_STYLESHEETS = [
  "https://api.fontshare.com/v2/css?f[]=satoshi@1,2&display=swap",
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} ${googleFontVariables.join(" ")}`}>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        {FONTSHARE_STYLESHEETS.map((href) => (
          <link key={href} rel="stylesheet" href={href} precedence="default" />
        ))}
        {children}
      </body>
    </html>
  );
}
