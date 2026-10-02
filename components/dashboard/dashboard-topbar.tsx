import Link from "next/link";
import { Bell, ChevronDown, LogOut, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { demoWorkspace } from "@/config/dashboard";
import { LogoMark } from "@/components/ui/logo";

const menuPanel =
  "absolute right-0 z-40 mt-2 w-64 rounded-xl border border-line bg-white p-2 shadow-lift";
const summaryReset = "list-none [&::-webkit-details-marker]:hidden";

export function DashboardTopbar({ menuButton }: { menuButton: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-5 backdrop-blur sm:px-8 lg:px-10">
      {menuButton}

      <div className="flex min-w-0 items-center gap-2 rounded-lg border border-line px-2.5 py-1.5">
        <LogoMark className="size-5" />
        <span className="truncate text-sm font-medium text-ink">{demoWorkspace.name}</span>
        <span className="hidden rounded-full bg-brand-softer px-2 py-0.5 text-[0.6875rem] font-medium text-brand sm:inline">
          Demo
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <details className="relative">
          <summary
            className={`${summaryReset} inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-ink`}
            aria-label="Notifications"
          >
            <Bell className="size-[18px]" aria-hidden="true" />
          </summary>
          <div className={menuPanel}>
            <p className="px-2 py-1.5 text-sm font-semibold text-ink">Notifications</p>
            <p className="px-2 pb-2 text-sm text-ink-muted">You&apos;re all caught up. Notifications arrive in a later phase.</p>
          </div>
        </details>

        <details className="relative">
          <summary
            className={`${summaryReset} flex cursor-pointer items-center gap-1.5 rounded-lg p-1 hover:bg-surface-muted`}
            aria-label="Profile menu"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">
              {demoWorkspace.user.initials}
            </span>
            <ChevronDown className="hidden size-4 text-ink-subtle sm:block" aria-hidden="true" />
          </summary>
          <div className={menuPanel}>
            <p className="px-2 pt-1.5 text-sm font-semibold text-ink">{demoWorkspace.user.name}</p>
            <p className="px-2 pb-2 text-xs text-ink-subtle">Demo session — no account signed in</p>
            <div className="border-t border-line pt-1">
              <Link href="/dashboard/settings" className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink">
                <Settings className="size-4" aria-hidden="true" /> Settings
              </Link>
              <Link href="/" className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink">
                <LogOut className="size-4" aria-hidden="true" /> Exit demo
              </Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
