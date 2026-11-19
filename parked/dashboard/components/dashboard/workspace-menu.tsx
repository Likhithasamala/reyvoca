"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronsUpDown, LogIn, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { routes } from "@/config/site";
import type { WorkspaceIdentity } from "@/types";
import { SignOutButton } from "@/components/panel/sign-out-button";

const menuItem =
  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[0.8125rem] text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink disabled:opacity-60";

/**
 * Compact workspace/user block at the foot of the sidebar.
 *
 * The identity is resolved from the session on the server. Signed out, the
 * block is labelled as the development workspace rather than implying an
 * account exists.
 */
export function WorkspaceMenu({
  workspace,
  collapsed = false,
}: {
  workspace: WorkspaceIdentity;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <div className="px-2 pt-2">
        <Link
          href="/"
          title="Back to website"
          className="flex items-center justify-center rounded-lg p-2.5 text-ink-subtle transition-colors hover:bg-line/60 hover:text-ink"
        >
          <ArrowUpRight className="size-[17px]" strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">Back to website</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-3 pt-2">
      <details className="group/menu relative">
        <summary
          className={cn(
            "flex cursor-pointer list-none items-center gap-2.5 rounded-lg px-2.5 py-2",
            "transition-colors hover:bg-line/50 [&::-webkit-details-marker]:hidden",
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand text-[0.6875rem] font-semibold text-white">
            {workspace.initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.8125rem] font-medium text-ink">{workspace.name}</span>
            <span className="block truncate text-[0.6875rem] text-ink-subtle">{workspace.user}</span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
        </summary>

        <div className="absolute bottom-full left-0 z-40 mb-2 w-full min-w-52 rounded-xl border border-line bg-surface p-1.5 shadow-lift">
          <p className="px-2 pt-1 pb-2 text-[0.6875rem] leading-relaxed break-words text-ink-subtle">
            {workspace.signedIn
              ? workspace.email
              : "Development workspace — sign in to use your own account."}
          </p>
          <div className="border-t border-line pt-1">
            <Link href="/dashboard/settings" className={menuItem}>
              <UserRound className="size-4" aria-hidden="true" /> Account
            </Link>
            <Link href="/" className={menuItem}>
              <ArrowUpRight className="size-4" aria-hidden="true" /> Back to website
            </Link>
            {/* Operators only. The panel itself re-checks on the server. */}
            {workspace.isAdmin && (
              <Link href="/admin" className={menuItem}>
                <ShieldCheck className="size-4" aria-hidden="true" /> Operator panel
              </Link>
            )}
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
  );
}
