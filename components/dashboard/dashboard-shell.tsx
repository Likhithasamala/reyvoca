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
  "size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink";

/**
 * Application frame: a fixed dark rail on the left, scrolling workspace on the
 * right. The rail collapses to icons on desktop and becomes a drawer on mobile,
 * offering the same navigation in all three states.
 *
 * The workspace identity is resolved on the server and passed in, so the rail
 * and topbar name the signed-in account rather than a placeholder.
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
        "min-h-dvh bg-canvas lg:grid",
        collapsed ? "lg:grid-cols-[68px_minmax(0,1fr)]" : "lg:grid-cols-[264px_minmax(0,1fr)]",
      )}
    >
      {/* Desktop rail */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh flex-col bg-night py-4 lg:flex",
          collapsed ? "items-stretch" : "",
        )}
      >
        <div className={cn("flex items-center", collapsed ? "justify-center px-2" : "px-5")}>
          {collapsed ? (
            <Link href="/dashboard" aria-label="Reyvoca dashboard" title="Reyvoca">
              <LogoMark className="size-7" inverse />
            </Link>
          ) : (
            <Logo href="/dashboard" inverse className="min-w-0" />
          )}
        </div>

        <div className="mt-6 flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarNav collapsed={collapsed} />
        </div>

        <div className="border-t border-night-line/70 pt-2">
          <WorkspaceMenu workspace={workspace} collapsed={collapsed} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn("fixed inset-0 z-50 lg:hidden", !drawerOpen && "pointer-events-none")}
        aria-hidden={!drawerOpen}
      >
        <div
          className={cn("absolute inset-0 bg-night/50 transition-opacity", drawerOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          id="dashboard-drawer"
          inert={!drawerOpen}
          className={cn(
            "absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col bg-night py-4 shadow-float transition-transform duration-300",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between gap-2 px-5">
            <Logo href="/dashboard" inverse className="min-w-0" />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-night-muted transition-colors hover:bg-night-raised hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-6 flex-1 overflow-y-auto">
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </div>

          <div className="border-t border-night-line/70 pt-2">
            <WorkspaceMenu workspace={workspace} />
          </div>
        </div>
      </div>

      {/* Workspace */}
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
        <main id="main" className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
