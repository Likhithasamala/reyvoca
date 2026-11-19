"use client";

import Link from "next/link";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { WorkspaceIdentity } from "@/types";
import { Logo, LogoMark } from "@/components/ui/logo";
import { cn } from "@/lib/cn";
import { SidebarNav } from "./sidebar-nav";
import { Topbar } from "./topbar";
import { WorkspaceMenu } from "./workspace-menu";

const iconButton =
  "size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-line/60 hover:text-ink";

/**
 * Framed-sheet shell: the sidebar and top bar share one warm paper tint with
 * no rule between them (the L-frame); the work sits on a white sheet inset
 * 8px from the window's right and bottom edges with a hairline edge and soft
 * corners. On the phone the frame disappears and the sheet is the screen.
 */
export function DashboardShell({
  children,
  workspace,
}: {
  children: ReactNode;
  workspace: WorkspaceIdentity;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const drawerToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        drawerToggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <div
      className={cn(
        "min-h-dvh bg-surface-muted lg:grid",
        collapsed ? "lg:grid-cols-[68px_minmax(0,1fr)]" : "lg:grid-cols-[248px_minmax(0,1fr)]",
      )}
    >
      {/* Desktop rail — same ground as the top bar, no rule between them */}
      <aside className="sticky top-0 hidden h-dvh flex-col py-4 lg:flex">
        <div className={cn("flex items-center", collapsed ? "justify-center px-2" : "px-5")}>
          {collapsed ? (
            <Link href="/dashboard" aria-label="Reyvoca dashboard" title="Reyvoca">
              <LogoMark className="size-7" />
            </Link>
          ) : (
            <Logo href="/dashboard" className="min-w-0" />
          )}
        </div>

        <div className="mt-6 flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarNav collapsed={collapsed} />
        </div>

        <WorkspaceMenu workspace={workspace} collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn("fixed inset-0 z-50 lg:hidden", !drawerOpen && "pointer-events-none")}
        aria-hidden={!drawerOpen}
      >
        <div
          className={cn("absolute inset-0 bg-ink/40 transition-opacity", drawerOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          id="dashboard-drawer"
          inert={!drawerOpen}
          className={cn(
            "absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col bg-surface-muted py-4 transition-transform duration-300",
            drawerOpen ? "translate-x-0 shadow-float" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between gap-2 px-5">
            <Logo href="/dashboard" className="min-w-0" />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-line/60 hover:text-ink"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-6 flex-1 overflow-y-auto">
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </div>

          <WorkspaceMenu workspace={workspace} />
        </div>
      </div>

      {/* Workspace: top bar on the frame, the sheet below it */}
      <div className="flex min-w-0 flex-col">
        <Topbar
          workspace={workspace}
          leading={
            <>
              <button
                ref={drawerToggleRef}
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation"
                aria-expanded={drawerOpen}
                aria-controls="dashboard-drawer"
                className={cn(iconButton, "inline-flex lg:hidden")}
              >
                <Menu className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-pressed={collapsed}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className={cn(iconButton, "hidden lg:inline-flex")}
              >
                {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
              </button>
            </>
          }
        />
        <div className="flex min-w-0 flex-1 flex-col bg-surface lg:mr-2 lg:mb-2 lg:rounded-2xl lg:border lg:border-line">
          <main id="main" className="flex-1 px-4 py-6 sm:px-6 sm:py-7">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
