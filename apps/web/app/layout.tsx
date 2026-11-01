import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arche UI",
  description: "Complete, installable React component libraries generated from data.",
};

// Runs before paint: visitor's saved choice wins, else the OS preference.
const themeInitScript = `(function(){try{var t=localStorage.getItem('arche-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
