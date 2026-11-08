import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import "./theme.css";
import "./proto.css";
import "./acme.css";
import { fontSans, fontDisplay, fontMono } from "./fonts.generated";
import { ThemeBootstrap } from "@/components/theme-bootstrap";

export const metadata: Metadata = {
  title: "Arche UI",
  description: "Generate complete React component libraries with AI, tailored to your brand identity.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // SSR theme (no inline <script>: React flags component-rendered script tags
  // as never-executing on the client). The arche-theme cookie mirrors the
  // localStorage choice; first visits fall back to light here and the
  // ThemeBootstrap client component applies the OS preference before paint.
  const cookieStore = await cookies();
  const stored = cookieStore.get("arche-theme")?.value;
  const initialDark = stored === "dark";
  return (
    <html
      lang="en"
      data-theme={initialDark ? "dark" : "light"}
      className={initialDark ? "dark" : undefined}
      suppressHydrationWarning
    >
      <body className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}>
        <ThemeBootstrap />
        {children}
      </body>
    </html>
  );
}
