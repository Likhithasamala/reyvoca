"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeNavHref, dashboardNavGroups } from "@/config/dashboard-nav";
import { cn } from "@/lib/cn";

/**
 * The primary destinations, grouped. Rendered on the frame's sidebar and again
 * inside the mobile drawer, so both always offer the same navigation.
 *
 * The chrome recedes: sentence-case grey group labels, a neutral pill on the
 * active item, no colour in the rail.
 */
export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  /** Icons only, with tooltips via the native title attribute. */
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = activeNavHref(pathname);

  return (
    <nav aria-label="Dashboard" className={cn("flex flex-col gap-5", collapsed ? "px-2" : "px-3")}>
      {dashboardNavGroups.map((group) => (
        <div key={group.title}>
          {collapsed ? (
            // Keeps the grouping audible for screen readers while hiding the label.
            <h2 className="sr-only">{group.title}</h2>
          ) : (
            <h2 className="px-2.5 pb-1.5 text-xs font-medium text-ink-subtle">{group.title}</h2>
          )}
          <ul className="space-y-0.5">
            {group.items.map(({ label, href, icon: Icon }) => {
              const current = active === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={current ? "page" : undefined}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "flex items-center rounded-lg text-[0.8125rem] transition-colors",
                      collapsed ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2",
                      current
                        ? "bg-line/70 font-medium text-ink"
                        : "text-ink-muted hover:bg-line/40 hover:text-ink",
                    )}
                  >
                    <Icon
                      className={cn("size-[17px] shrink-0", current ? "text-ink" : "text-ink-subtle")}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    {!collapsed && <span className="truncate">{label}</span>}
                    {collapsed && <span className="sr-only">{label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
