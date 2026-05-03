"use client";

import Link from "next/link";
import { Socials } from "./socials";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl py-2">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Left: Company Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>@2026 siphl.xyz</span>
            <span>•</span>
            <span>All rights reserved</span>
          </div>

          <Socials />
        </div>
      </div>
    </footer>
  );
}
