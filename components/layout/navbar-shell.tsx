import type { ReactNode } from "react";

/** Sticky header: a plain solid bar on the page ground. */
export function NavbarShell({ children }: { children: ReactNode }) {
  return <header className="sticky top-0 z-50 bg-canvas">{children}</header>;
}
