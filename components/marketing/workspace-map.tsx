import { ChevronRight } from "lucide-react";
import type { LeadMode } from "@/config/lead-modes";

/**
 * A drawn map of where a calling module sits in the client's workspace.
 *
 * Reyvoca builds and hands over the workspace, so a visitor never gets to
 * click around and find this for themselves — the diagram is the only honest
 * way to answer "where would I see this?". It is a drawing, not a screenshot
 * and not a link: the sidebar on the left with the module marked in ember, and
 * the screen it opens on the right.
 *
 * Everything in the right-hand sheet is example content, labelled as such.
 * Ember appears twice only: on the module itself and on the one live row.
 */
export function WorkspaceMap({ mode }: { mode: LeadMode }) {
  const { workspace, workspaceLabel } = mode;

  return (
    <figure className="m-0">
      {/* The warm paper frame: the app's own chrome, drawn flat. */}
      <div className="rounded-[1.25rem] border border-line bg-surface-muted p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[11.5rem_1fr] lg:grid-cols-[13rem_1fr] lg:gap-4">
          {/* ---------------- the sidebar ---------------- */}
          <div className="rounded-2xl border border-line bg-canvas p-3">
            <div className="space-y-3">
              {workspace.groups.map((group) => (
                <div key={group.title}>
                  <p className="px-1 text-[0.8125rem] font-semibold text-ink-subtle">{group.title}</p>
                  <ul className="mt-1.5 space-y-1">
                    {group.items.map((item) => (
                      <li key={item.label}>
                        <span
                          className={
                            item.mark === "primary"
                              ? "flex items-center gap-2 rounded-lg border border-accent-soft bg-accent-wash px-2.5 py-2 text-[0.8125rem] font-semibold text-ink"
                              : item.mark === "results"
                                ? "flex items-center gap-2 rounded-lg border border-line-strong bg-canvas px-2.5 py-2 text-[0.8125rem] font-medium text-ink-muted"
                                : "flex items-center gap-2 rounded-lg px-2.5 py-2 text-[0.8125rem] text-ink-subtle"
                          }
                        >
                          <span
                            aria-hidden="true"
                            className={
                              item.mark === "primary"
                                ? "size-1.5 shrink-0 rounded-full bg-accent"
                                : "size-1.5 shrink-0 rounded-full bg-line-strong"
                            }
                          />
                          <span className="min-w-0 truncate">{item.label}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* ---------------- the screen it opens ---------------- */}
          <div className="min-w-0 rounded-2xl border border-line bg-surface p-4 lg:p-5">
            <nav aria-label="Where this screen sits" className="flex items-center gap-1 text-[0.8125rem] text-ink-subtle">
              {workspace.path.map((crumb, index) => (
                <span key={crumb} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight aria-hidden="true" className="size-3" />}
                  <span className={index === workspace.path.length - 1 ? "font-semibold text-accent-strong" : undefined}>
                    {crumb}
                  </span>
                </span>
              ))}
            </nav>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-ink">{workspaceLabel}</h3>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-soft bg-accent-wash px-2.5 py-0.5 text-[0.8125rem] font-medium text-accent-strong">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                {workspace.panel.status}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
              {workspace.panel.tiles.map((tile) => (
                <div key={tile.label} className="min-w-0 bg-canvas px-3 py-2.5">
                  <dt className="text-[0.8125rem] leading-snug font-medium text-ink-subtle">{tile.label}</dt>
                  <dd className="mt-0.5 text-xl font-semibold tracking-tight text-ink tabular-nums">{tile.value}</dd>
                </div>
              ))}
            </dl>

            <ul className="mt-3 space-y-1.5">
              {workspace.panel.rows.map((row) => (
                <li
                  key={row.name}
                  className={
                    row.state === "live"
                      ? "flex min-w-0 items-center justify-between gap-3 rounded-xl border border-accent-soft bg-accent-wash px-3 py-2.5"
                      : "flex min-w-0 items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-3 py-2.5"
                  }
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[0.9375rem] font-medium text-ink">{row.name}</span>
                    <span className="mt-0.5 block truncate text-[0.8125rem] text-ink-subtle">{row.detail}</span>
                  </span>

                  {row.state === "live" ? (
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                      <span className="text-[0.8125rem] font-medium text-accent-strong">Live</span>
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className={
                        row.state === "done"
                          ? "size-1.5 shrink-0 rounded-full bg-ink-subtle"
                          : "size-1.5 shrink-0 rounded-full bg-line-strong"
                      }
                    />
                  )}
                </li>
              ))}
            </ul>

            <p className="mt-3 text-[0.8125rem] text-ink-subtle">Example content, not live data.</p>
          </div>
        </div>
      </div>

      <figcaption className="mt-4 flex flex-col gap-2 text-sm text-ink-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 shrink-0 rounded-[0.25rem] border border-accent-soft bg-accent-wash" />
          {workspaceLabel} — the screen this product opens
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 shrink-0 rounded-[0.25rem] border border-line-strong bg-canvas" />
          Leads &amp; Results — where the finished calls are read back
        </span>
      </figcaption>
    </figure>
  );
}
