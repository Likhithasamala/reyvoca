import { Phone } from "lucide-react";

/**
 * The small illustrations inside the three-step cards.
 *
 * All example content — fictional names, a sample file, a sample percentage —
 * drawn with the approved palette: ink type on cream, ember used only to mark
 * what is live.
 */

/* ------------------------------------------------------------------ */
/* Instant Leads                                                       */
/* ------------------------------------------------------------------ */

/** 01 — a single enquiry card, with the sources it can arrive from. */
export function LeadArrivesVisual() {
  return (
    <div className="w-full max-w-60">
      <div className="rounded-xl border border-line bg-canvas p-3.5">
        <p className="text-sm font-semibold text-ink">Ramesh Kumar</p>
        <p className="mt-0.5 text-xs text-ink-subtle">Hyderabad</p>
        <div className="mt-3 border-t border-line pt-2.5">
          <p className="text-[0.625rem] font-medium tracking-[0.08em] text-ink-subtle uppercase">Source</p>
          <p className="mt-0.5 text-xs font-medium text-ink">Meta Lead Ad</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {["Website", "Meta", "CRM"].map((source) => (
          <span
            key={source}
            className="rounded-full border border-line bg-surface-muted px-2 py-0.5 text-[0.625rem] font-medium text-ink-muted"
          >
            {source}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 02 — a call in progress, timer ringed in ember. */
export function CallingVisual() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex size-28 items-center justify-center rounded-full border-2 border-accent-soft">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent"
        />
        <div className="text-center">
          <p className="text-xl font-semibold tracking-tight text-ink tabular-nums">00:06</p>
          <p className="mt-0.5 text-[0.625rem] font-medium tracking-[0.08em] text-accent-strong uppercase">
            On call
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-end gap-1" aria-hidden="true">
        <Phone className="mr-1 size-3.5 self-center text-ink-subtle" strokeWidth={1.75} />
        {[7, 13, 9, 16, 11, 6, 12].map((height, index) => (
          <span key={index} className="w-0.5 rounded-full bg-accent/70" style={{ height: `${height}px` }} />
        ))}
      </div>
    </div>
  );
}

/** 03 — the captured outcome and what else can come back from a call. */
export function ResultVisual() {
  return (
    <div className="w-full max-w-60">
      <div className="rounded-xl border border-success-line bg-success-soft px-3.5 py-3 text-center">
        <p className="text-[0.625rem] font-medium tracking-[0.08em] text-success uppercase">Result</p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-success">Qualified</p>
      </div>

      <ul className="mt-3 space-y-1.5">
        {["Interested", "Meeting requested", "Callback"].map((value) => (
          <li
            key={value}
            className="flex items-center justify-between rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink-muted"
          >
            {value}
            <span aria-hidden="true" className="size-1.5 rounded-full bg-line-strong" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bulk Campaigns                                                      */
/* ------------------------------------------------------------------ */

/** 01 — the uploaded list, as a file with a row count. */
export function UploadVisual() {
  return (
    <div className="w-full max-w-60">
      <div className="rounded-xl border border-line bg-canvas p-4 text-center">
        <p className="text-3xl font-semibold tracking-tight text-ink tabular-nums">247</p>
        <p className="mt-0.5 text-xs text-ink-subtle">contacts</p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          contacts.csv
        </p>
      </div>

      <div className="mt-3 space-y-1" aria-hidden="true">
        {[90, 70, 80].map((width, index) => (
          <span key={index} className="block h-1 rounded-full bg-line" style={{ width: `${width}%` }} />
        ))}
      </div>
    </div>
  );
}

/** 02 — the list being worked through, one contact live. */
export function CallingListVisual() {
  const contacts = [
    { name: "Lakshmi Devi", state: "done" as const },
    { name: "Anitha Reddy", state: "live" as const },
    { name: "Vijay Prasad", state: "waiting" as const },
  ];

  return (
    <ul className="w-full max-w-60 space-y-2">
      {contacts.map((contact) => (
        <li
          key={contact.name}
          className={
            contact.state === "live"
              ? "flex items-center justify-between rounded-lg border border-accent-soft bg-accent-wash px-3 py-2.5"
              : "flex items-center justify-between rounded-lg border border-line bg-canvas px-3 py-2.5"
          }
        >
          <span className={contact.state === "live" ? "text-sm font-medium text-ink" : "text-sm text-ink-muted"}>
            {contact.name}
          </span>

          {contact.state === "live" ? (
            <span className="flex items-center gap-1" aria-label="Calling now">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
              <span className="text-[0.625rem] font-medium text-accent-strong">Calling</span>
            </span>
          ) : (
            <span
              aria-hidden="true"
              className={
                contact.state === "done" ? "size-1.5 rounded-full bg-ink-subtle" : "size-1.5 rounded-full bg-line-strong"
              }
            />
          )}
        </li>
      ))}
    </ul>
  );
}

/** 03 — progress ring plus the results coming back. */
export function ProgressVisual() {
  const percent = 62;
  // A conic gradient keeps the ring to CSS — no chart dependency for one dial.
  const ring = `conic-gradient(var(--color-accent) ${percent * 3.6}deg, var(--color-line) 0deg)`;

  return (
    <div className="flex flex-col items-center">
      <div
        className="flex size-28 items-center justify-center rounded-full"
        style={{ background: ring }}
        role="img"
        aria-label={`${percent} percent complete, 153 of 247 calls finished`}
      >
        <div className="flex size-[88px] flex-col items-center justify-center rounded-full bg-surface">
          <p className="text-xl font-semibold tracking-tight text-ink tabular-nums">{percent}%</p>
          <p className="mt-0.5 text-[0.625rem] text-ink-subtle tabular-nums">153 of 247</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {["Qualified", "Callback", "No answer"].map((label) => (
          <span
            key={label}
            className="rounded-full border border-line bg-canvas px-2 py-0.5 text-[0.625rem] font-medium text-ink-muted"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
