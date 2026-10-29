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
          ? "border-line bg-canvas/80 backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-canvas",
      )}
    >
      {children}
    </header>
  );
}
