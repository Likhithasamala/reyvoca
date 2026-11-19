"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { routes } from "@/config/site";
import { LogoMark } from "@/components/ui/logo";
import { ProductsMenu } from "@/components/layout/products-menu";
import { cn } from "@/lib/cn";

/**
 * The homepage bar: one dark pill floating over whatever section is behind it.
 *
 * It starts wide and open at the top of the page and draws itself in once you
 * scroll, so the bar gets out of the way of the content without ever leaving.
 * The pill stays dark on every section, light or dark, so it never has to
 * swap its own colours mid-scroll.
 *
 * A phone has room for the logo, one menu and the action, so Pricing and
 * signing in fold into the Products menu below the small breakpoint rather
 * than being dropped.
 */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      setScrolled(window.scrollY > 28);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Escape and a click anywhere outside close the menu, as a menu should.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  /**
   * Home, from the homepage.
   *
   * A link to "/" while already on "/" is a no-op in the router, so the reader
   * clicks and nothing moves. Scroll them back to the hero instead, and drop
   * any section hash the page picked up on the way down. The scroll inherits
   * `scroll-behavior` from the stylesheet, which is already `auto` under
   * prefers-reduced-motion. Modified clicks are left alone so "open in a new
   * tab" still works.
   */
  const goHome = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (window.location.pathname !== routes.home) return;
    event.preventDefault();
    setOpen(false);
    window.scrollTo({ top: 0 });
    if (window.location.hash) window.history.replaceState(null, "", routes.home);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4">
      <nav
        aria-label="Main"
        className={cn(
          "pointer-events-auto flex items-center gap-2 rounded-full",
          // A hairline inside the pill, so it still has an edge where the page
          // closes into night and a dark pill would otherwise dissolve into
          // the dark ground. Inside, so it reads as a lit rim rather than a
          // halo when the pill is over paper.
          "inset-ring-1 inset-ring-white/12",
          "transition-[padding,margin,transform,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          // Solid once scrolling starts: a translucent pill lets headings
          // ghost through it as they pass behind, which reads as a mistake.
          scrolled ? "bg-night" : "bg-night/85 backdrop-blur-xl",
          scrolled ? "mt-2 p-1 pl-3 sm:gap-4 sm:pl-4" : "mt-3 p-1.5 pl-4 sm:gap-6 sm:pl-5",
        )}
      >
        <Link
          href={routes.home}
          onClick={goHome}
          aria-label="Reyvoca home"
          className="inline-flex items-center gap-2.5 pr-1"
        >
          <LogoMark inverse className={cn("transition-all duration-500", scrolled ? "size-6" : "size-7")} />
          <span
            className={cn(
              "overflow-hidden font-semibold tracking-[-0.02em] whitespace-nowrap text-white transition-all duration-500",
              "max-w-0 opacity-0 sm:opacity-100",
              scrolled ? "text-[0.9375rem] sm:max-w-24" : "text-[1rem] sm:max-w-24",
            )}
          >
            Reyvoca
          </span>
        </Link>

        <span className="flex items-center gap-4 px-1 sm:gap-5 lg:gap-7">
          <NavLink href={routes.home} onClick={goHome} className="hidden sm:inline">
            Home
          </NavLink>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-haspopup="true"
              className="inline-flex items-center gap-1 text-[0.9375rem] font-medium whitespace-nowrap text-night-text transition-colors hover:text-white"
            >
              Products
              <ChevronDown
                aria-hidden="true"
                className={cn("size-4 transition-transform duration-300", open && "rotate-180")}
              />
            </button>

            {open && (
              <div
                className={cn(
                  "absolute left-1/2 top-full z-10 mt-3 w-[min(92vw,17rem)] -translate-x-1/2 rounded-2xl bg-night p-2 shadow-float",
                  "sm:w-[min(94vw,38rem)]",
                  "origin-top animate-fade-in",
                )}
              >
                <ProductsMenu onNavigate={() => setOpen(false)} />

                {/* What the pill cannot show on a phone lives here instead. */}
                <span className="mt-2 block border-t border-night-line pt-2 sm:hidden">
                  {[
                    { label: "Home", href: routes.home, onClick: goHome },
                    { label: "How it works", href: routes.howItWorks },
                    { label: "Sign in", href: routes.signIn },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={(event) => {
                        item.onClick?.(event);
                        setOpen(false);
                      }}
                      className="block rounded-xl px-3 py-2.5 text-[0.9375rem] font-medium text-night-text transition-colors hover:bg-night-raised hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </span>
              </div>
            )}
          </div>

          <span className="hidden items-center gap-5 sm:flex lg:gap-7">
            <NavLink href={routes.howItWorks}>How it works</NavLink>
            <NavLink href={routes.signIn}>Sign in</NavLink>
          </span>
        </span>

        {/* The pill keeps exactly one filled action: booking the demo. */}
        <Link
          href={routes.bookDemo}
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-white font-semibold whitespace-nowrap text-ink",
            "transition-all duration-500 hover:bg-canvas",
            scrolled ? "min-h-9 px-4 text-[0.9375rem]" : "min-h-9 px-5 text-[0.9375rem]",
          )}
        >
          Book a demo
        </Link>
      </nav>
    </div>
  );
}

function NavLink({
  href,
  className,
  onClick,
  children,
}: {
  href: string;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "text-[0.9375rem] font-medium whitespace-nowrap text-night-text transition-colors hover:text-white",
        className,
      )}
    >
      {children}
    </Link>
  );
}
