"use client";

import { Inter } from "next/font/google";

import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import RainbowProvider from "@/components/providers/rainbow-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="shortcut icon" href="/favicon.ico" />
        <title>Siphl - Hyperliquid SIP Platform</title>
      </head>
      <body
        className={`${inter.className} antialiased relative min-h-screen min-w-screen`}
      >
        <RainbowProvider>
          <div className="min-h-screen w-full relative">
            {/* Dashed Top Fade Grid */}
            <div
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: `
         linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
         linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
       `,
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 0",
                maskImage: `
         repeating-linear-gradient(
               to right,
               black 0px,
               black 3px,
               transparent 3px,
               transparent 8px
             ),
             repeating-linear-gradient(
               to bottom,
               black 0px,
               black 3px,
               transparent 3px,
               transparent 8px
             ),
             radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)
       `,
                WebkitMaskImage: `
  repeating-linear-gradient(
               to right,
               black 0px,
               black 3px,
               transparent 3px,
               transparent 8px
             ),
             repeating-linear-gradient(
               to bottom,
               black 0px,
               black 3px,
               transparent 3px,
               transparent 8px
             ),
             radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)
       `,
                maskComposite: "intersect",
                WebkitMaskComposite: "source-in",
              }}
            />
            {/* Your Content/Components */}
            <div className="relative z-10">
              {children}
              <Toaster />
            </div>
          </div>
        </RainbowProvider>
      </body>
    </html>
  );
}
