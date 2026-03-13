import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

const displayFont = Manrope({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500"],
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "OneMoreSeoTool - SEO Audits",
  description: "Fast technical SEO checks for pages and domains",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeInitScript = `
    (() => {
      try {
        const storageKey = "one-more-seo-theme";
        const savedTheme = window.localStorage.getItem(storageKey);
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const theme = savedTheme === "light" || savedTheme === "dark"
          ? savedTheme
          : (prefersDark ? "dark" : "light");
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
      } catch {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${displayFont.variable} ${monoFont.variable} min-h-screen antialiased`}>
        <ThemeToggle />
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
