"use client";

import { Monitor } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth/service";
import type { SessionDeviceView } from "@/lib/auth/types";
import { ErrorNotice, SavedNotice } from "./account-section";

const WHEN = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const when = (iso?: string) => (iso ? WHEN.format(new Date(iso)) : "—");

/**
 * Where this account is signed in, and the button that cuts the others off.
 *
 * This is the user-facing payoff of storing sessions as rows: each one can be
 * ended individually, immediately, without changing the password.
 */
export function DeviceList({ sessions }: { sessions: SessionDeviceView[] }) {
  const router = useRouter();
  const [working, setWorking] = useState<string | null>(null);
  const [state, setState] = useState<{ done?: string; error?: string }>({});

  async function revoke(sessionId?: string) {
    setWorking(sessionId ?? "all");
    setState({});
    const result = await authService.revokeSessions(sessionId);
    setWorking(null);

    if (!result.ok) {
      setState({ error: result.message });
      return;
    }
    const count = result.data?.revoked ?? 0;
    setState({
      done:
        count === 0
          ? "There was nothing else signed in."
          : `${count} ${count === 1 ? "session" : "sessions"} ended.`,
    });
    router.refresh();
  }

  const others = sessions.filter((session) => !session.current).length;

  return (
    <div className="space-y-5">
      <ul className="divide-y divide-line">
        {sessions.map((session) => (
          <li key={session.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0">
            <Monitor className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">
                {session.device}
                {session.current && (
                  <span className="ml-2 rounded-full border border-success-line bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
                    This device
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-ink-subtle">
                {session.ip && session.ip !== "unknown" ? `${session.ip} · ` : ""}
                signed in {when(session.createdAt)} · last used {when(session.lastSeenAt)}
                {session.remember ? " · remembered" : ""}
              </p>
            </div>
            {!session.current && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => revoke(session.id)}
                disabled={working !== null}
              >
                {working === session.id ? "Ending…" : "Sign out"}
              </Button>
            )}
          </li>
        ))}
      </ul>

      {state.done && <SavedNotice>{state.done}</SavedNotice>}
      {state.error && <ErrorNotice>{state.error}</ErrorNotice>}

      {others > 0 && (
        <Button variant="secondary" onClick={() => revoke()} disabled={working !== null}>
          {working === "all" ? "Signing out…" : "Sign out of all other devices"}
        </Button>
      )}
    </div>
  );
}
