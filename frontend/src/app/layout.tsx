import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/features/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BrewDesk — Café & Restaurant Management",
  description:
    "Run your café end to end: fast POS billing, kitchen display, menu and table management, staff roles, and live sales — all in one place.",
};

// Applies the saved theme before paint to avoid a flash of the default palette.
const themeBootScript = `(function(){try{var v=localStorage.getItem('cafe.themeVars');if(v){var o=JSON.parse(v);var s=document.documentElement.style;for(var k in o){s.setProperty(k,o[k]);}}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
