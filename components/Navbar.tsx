"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavbarProps {
  activePage?: "swipe" | "recommendations" | "account";
  variant?: "solid" | "overlay";
  rightSlot?: React.ReactNode;
}

export function Navbar({ activePage, variant = "solid", rightSlot }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (variant !== "overlay") return;
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [variant]);

  const isOverlay = variant === "overlay";

  return (
    <>
      {/* ── TOP BAR ── */}
      <header
        className={cn(
          "z-50 transition-all duration-300",
          isOverlay
            ? cn(
                "fixed top-0 left-0 right-0",
                scrolled
                  ? "bg-bg-primary/95 backdrop-blur-md shadow-[0_1px_0_rgba(232,224,200,0.06)]"
                  : "bg-gradient-to-b from-bg-primary/80 to-transparent"
              )
            : "relative flex-shrink-0 border-b border-border backdrop-blur-md"
        )}
        style={!isOverlay ? { background: "var(--color-nav-bg)" } : undefined}
      >
        <div className={cn(
          "mx-auto flex items-center justify-between px-4 md:px-6",
          isOverlay ? "h-14 md:h-16 md:px-12" : "max-w-7xl py-3"
        )}>
          {/* Logo */}
          <Link
            href="/"
            className="select-none font-display text-lg md:text-xl font-bold tracking-tight text-text-primary"
          >
            Recomm<span className="text-secondary">andarr</span>
          </Link>

          {/* Nav centrale — desktop seulement */}
          <nav className={cn("hidden md:flex items-center", isOverlay ? "gap-7" : "gap-2")}>
            <Link
              href="/recommendations"
              className={cn(
                "transition-colors",
                isOverlay
                  ? cn("text-sm font-medium", activePage === "recommendations" ? "font-semibold text-text-primary" : "text-text-secondary hover:text-text-primary")
                  : cn("rounded-button px-4 py-2 text-sm font-medium", activePage === "recommendations" ? "bg-accent/10 text-accent" : "text-text-secondary hover:text-text-primary")
              )}
            >
              Recommandations
            </Link>
            <Link
              href="/swipe"
              className={cn(
                "transition-colors",
                isOverlay
                  ? cn("text-sm font-medium", activePage === "swipe" ? "font-semibold text-text-primary" : "text-text-secondary hover:text-text-primary")
                  : cn("rounded-button px-4 py-2 text-sm font-medium", activePage === "swipe" ? "bg-accent/10 text-accent" : "text-text-secondary hover:text-text-primary")
              )}
            >
              Swipe
            </Link>
          </nav>

          {/* Droite */}
          <div className="flex items-center gap-2 md:gap-3">
            {rightSlot ?? (
              <Link
                href="/account"
                className={cn(
                  isOverlay
                    ? "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-text-primary ring-2 ring-transparent hover:ring-secondary/40 transition-all"
                    : "rounded-button border border-border px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
                )}
                aria-label="Mon compte"
              >
                {isOverlay ? "R" : "Compte"}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── BOTTOM TAB BAR — mobile uniquement ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-border backdrop-blur-md"
        style={{ background: "var(--color-nav-bg)" }}
      >
        <Link
          href="/recommendations"
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors",
            activePage === "recommendations" ? "text-secondary" : "text-text-secondary"
          )}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activePage === "recommendations" ? 2.5 : 1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span className="text-[10px] font-medium">Reco</span>
        </Link>

        <Link
          href="/swipe"
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors",
            activePage === "swipe" ? "text-secondary" : "text-text-secondary"
          )}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activePage === "swipe" ? 2.5 : 1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m0-3-3-3m0 0-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75" />
          </svg>
          <span className="text-[10px] font-medium">Swipe</span>
        </Link>

        <Link
          href="/account"
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors",
            activePage === "account" ? "text-secondary" : "text-text-secondary"
          )}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activePage === "account" ? 2.5 : 1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          <span className="text-[10px] font-medium">Compte</span>
        </Link>
      </nav>
    </>
  );
}
