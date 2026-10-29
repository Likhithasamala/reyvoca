"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeNavHref, dashboardNavGroups } from "@/config/dashboard-nav";
import { cn } from "@/lib/cn";

/**
 * The thirteen primary destinations, grouped. Rendered on the dark sidebar and
 * again inside the mobile drawer, so both always offer the same navigation.
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
            <h2 className="px-2.5 pb-1.5 text-[0.6875rem] font-semibold tracking-[0.1em] text-night-muted uppercase">
              {group.title}
            </h2>
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
                      "relative flex items-center rounded-lg text-[0.8125rem] transition-colors",
                      collapsed ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2",
                      current
                        ? "bg-night-raised font-medium text-white"
                        : "text-night-text hover:bg-night-raised/60 hover:text-white",
                    )}
                  >
                    {/* Ember indicator marks the current page without flooding the rail with colour. */}
                    {current && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute rounded-full bg-accent",
                          collapsed ? "inset-x-2 bottom-1 h-0.5" : "inset-y-1.5 left-0 w-0.5",
                        )}
                      />
                    )}
                    <Icon
                      className={cn("size-[17px] shrink-0", current ? "text-accent-glow" : "text-night-muted")}
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
