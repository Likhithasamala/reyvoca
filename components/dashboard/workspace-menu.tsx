"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronsUpDown, LogIn, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { routes } from "@/config/site";
import type { WorkspaceIdentity } from "@/types";
import { SignOutButton } from "./sign-out-button";

const menuItem =
  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[0.8125rem] text-night-text transition-colors hover:bg-night/60 hover:text-white disabled:opacity-60";

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
          className="flex items-center justify-center rounded-lg p-2.5 text-night-muted transition-colors hover:bg-night-raised hover:text-white"
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
            "flex cursor-pointer list-none items-center gap-2.5 rounded-lg border border-night-line/70 px-2.5 py-2",
            "transition-colors hover:bg-night-raised [&::-webkit-details-marker]:hidden",
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-night-raised text-[0.6875rem] font-semibold text-accent-glow">
            {workspace.initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.8125rem] font-medium text-white">{workspace.name}</span>
            <span className="block truncate text-[0.6875rem] text-night-muted">{workspace.user}</span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-night-muted" aria-hidden="true" />
        </summary>

        <div className="absolute bottom-full left-0 z-40 mb-2 w-full min-w-52 rounded-xl border border-night-line bg-night-raised p-1.5 shadow-float">
          <p className="px-2 pt-1 pb-2 text-[0.6875rem] leading-relaxed break-words text-night-muted">
            {workspace.signedIn
              ? workspace.email
              : "Development workspace — sign in to use your own account."}
          </p>
          <div className="border-t border-night-line pt-1">
            <Link href="/dashboard/settings" className={menuItem}>
              <UserRound className="size-4" aria-hidden="true" /> Account
            </Link>
            <Link href="/" className={menuItem}>
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
  );
}
