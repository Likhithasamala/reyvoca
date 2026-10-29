"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { routes } from "@/config/site";
import { authService } from "@/lib/auth/service";

/**
 * Ends the session through `POST /api/auth/sign-out`.
 *
 * The session cookie is httpOnly, so only the server can clear it. `refresh()`
 * then makes the dashboard layout re-resolve the workspace against the empty
 * session, so the chrome stops naming an account that is no longer signed in.
 */
export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const result = await authService.signOut();
    if (!result.ok) {
      // Nothing was cleared, so stay put rather than pretending to sign out.
      setSigningOut(false);
      return;
    }
    router.replace(result.redirectTo ?? routes.home);
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} disabled={signingOut} className={className}>
      <LogOut className="size-4" aria-hidden="true" />
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
