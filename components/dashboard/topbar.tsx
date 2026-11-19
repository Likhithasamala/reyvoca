import Link from "next/link";
import { ArrowUpRight, Bell, BookOpen, ChevronDown, LogIn, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { WorkspaceIdentity } from "@/types";
import { routes } from "@/config/site";
import { GlobalSearch } from "./global-search";
import { SignOutButton } from "@/components/panel/sign-out-button";

const menuPanel =
  "absolute right-0 z-40 mt-2 w-64 rounded-xl border border-line bg-surface p-2 shadow-lift";
const summaryReset =
  "list-none cursor-pointer [&::-webkit-details-marker]:hidden";
const iconButton =
  "inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-line/60 hover:text-ink";
const menuItem =
  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink disabled:opacity-60";

/** Utility bar above the page content. Deliberately sparse. */
export function Topbar({
  workspace,
  leading,
}: {
  workspace: WorkspaceIdentity;
  /** Menu / collapse controls supplied by the shell. */
  leading?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-2 bg-surface-muted px-4 sm:gap-3 sm:px-6">
      {leading}

      <GlobalSearch className="min-w-0 max-w-sm flex-1" />

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        <span className="hidden rounded-full border border-line bg-surface px-2.5 py-1 text-[0.6875rem] font-medium text-ink-muted lg:inline">
          {workspace.signedIn ? workspace.name : "Demo workspace"}
        </span>

        <Link href={routes.docs} title="Docs" className={iconButton}>
          <BookOpen className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">Docs</span>
        </Link>

        <details className="relative">
          <summary className={`${summaryReset} ${iconButton}`} aria-label="Notifications">
            <Bell className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
          </summary>
          <div className={menuPanel}>
            <p className="px-2 py-1.5 text-sm font-semibold text-ink">Notifications</p>
            <p className="px-2 pb-2 text-xs leading-relaxed text-ink-muted">
              Nothing yet. Call and campaign alerts arrive with the calling infrastructure.
            </p>
          </div>
        </details>

        <details className="relative">
          <summary
            className={`${summaryReset} flex items-center gap-1.5 rounded-lg p-1 transition-colors hover:bg-surface-muted`}
            aria-label="Profile menu"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-brand text-[0.6875rem] font-semibold text-white">
              {workspace.initials}
            </span>
            <ChevronDown className="hidden size-4 text-ink-subtle sm:block" aria-hidden="true" />
          </summary>
          <div className={menuPanel}>
            <p className="px-2 pt-1.5 text-sm font-semibold text-ink">{workspace.user}</p>
            <p className="px-2 pb-2 text-xs leading-relaxed break-words text-ink-subtle">
              {workspace.signedIn
                ? workspace.email
                : "Development workspace — no account is signed in."}
            </p>
            <div className="space-y-0.5 border-t border-line pt-1">
              <Link href="/dashboard/settings" className={menuItem}>
                <UserRound className="size-4" aria-hidden="true" /> Account
              </Link>
              <Link href={routes.home} className={menuItem}>
                <ArrowUpRight className="size-4" aria-hidden="true" /> Back to website
              </Link>
              {workspace.signedIn ? (
                <SignOutButton className={menuItem} />
              ) : (
                <Link href={routes.signIn} className={menuItem}>
                  <LogIn className="size-4" aria-hidden="true" /> Sign in
                </Link>
              )}
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
