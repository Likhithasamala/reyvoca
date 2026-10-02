"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/cn";

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const getScrolled = () => window.scrollY > 8;
const getServerScrolled = () => false;

/** Sticky header that gains a blurred backdrop and border once the page scrolls. */
export function NavbarShell({ children }: { children: ReactNode }) {
  const scrolled = useSyncExternalStore(subscribe, getScrolled, getServerScrolled);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-line bg-white/80 shadow-[0_1px_12px_-6px_rgb(15_23_42/0.12)] backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-white",
      )}
    >
      {children}
    </header>
  );
}
