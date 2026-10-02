"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { dashboardHref, dashboardNav, demoWorkspace } from "@/config/dashboard";
import { LogoMark } from "@/components/ui/logo";
import { cn } from "@/lib/cn";
import { DashboardTopbar } from "./dashboard-topbar";

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {dashboardNav.map(({ label, slug, icon: Icon }) => {
        const href = dashboardHref(slug);
        const active = pathname === href;
        return (
          <li key={label}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-brand-softer font-medium text-brand" : "text-ink-muted hover:bg-surface-muted hover:text-ink",
              )}
            >
              <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarBrand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-3">
      <LogoMark className="size-7" />
      <span className="font-semibold tracking-tight text-ink">Reyvoca</span>
    </Link>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="min-h-dvh bg-surface-muted lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-white py-5 lg:flex">
        <SidebarBrand />
        <nav aria-label="Dashboard" className="mt-6 flex-1 overflow-y-auto px-3">
          <SidebarNav />
        </nav>
        <p className="mx-3 rounded-lg bg-surface-muted px-3 py-2 text-xs text-ink-subtle">
          Workspace: {demoWorkspace.name}
        </p>
      </aside>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", !open && "pointer-events-none")} aria-hidden={!open}>
        <div
          className={cn("absolute inset-0 bg-navy/40 transition-opacity", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <div
          id="dashboard-drawer"
          inert={!open}
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white py-5 shadow-float transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between pr-3">
            <SidebarBrand />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted"
            >
              <X className="size-5" />
            </button>
          </div>
          <nav aria-label="Dashboard (mobile)" className="mt-6 overflow-y-auto px-3">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      </div>

      <div className="flex min-w-0 flex-col">
        <DashboardTopbar
          menuButton={
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              aria-expanded={open}
              aria-controls="dashboard-drawer"
              className="inline-flex size-9 items-center justify-center rounded-lg text-ink hover:bg-surface-muted lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          }
        />
        <main id="main" className="flex-1 px-5 py-8 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
