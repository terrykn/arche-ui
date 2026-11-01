import type { Metadata } from "next";
import "./globals.css";
import "./theme.css";
import "./proto.css";
import "./acme.css";
import { manrope, jetbrainsMono } from "./fonts";

export const metadata: Metadata = {
  title: "Arche UI",
  description: "Generate complete React component libraries with AI, tailored to your brand identity.",
};

// data-theme drives the prototype token set; .dark follows for Tailwind surfaces.
const themeInitScript = `(function(){try{var t=localStorage.getItem('arche-theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';if(d)document.documentElement.classList.add('dark')}catch(e){document.documentElement.dataset.theme='light'}})();`;

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
      <body className={`${manrope.variable} ${jetbrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
