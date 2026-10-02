/**
 * Mock UI panels for the feature stories. Illustrative only — every value
 * shown is sample content, rendered as static markup.
 */
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarCheck,
  Check,
  Database,
  FileText,
  Globe,
  Loader2,
  Sparkles,
  Webhook,
} from "lucide-react";
import type { ReactNode } from "react";
import { demoWeeklyCalls } from "@/config/dashboard";
import { WeeklyCallsChart } from "@/components/dashboard/weekly-calls-chart";
import { Waveform } from "@/components/ui/waveform";
import { cn } from "@/lib/cn";
import type { FeatureStoryVisual } from "@/types";

function Panel({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {meta}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" | "success" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        tone === "brand" && "border-brand-soft bg-brand-softer text-brand",
        tone === "success" && "border-green-200 bg-success-soft text-success",
        tone === "neutral" && "border-line bg-surface-muted text-ink-muted",
      )}
    >
      {children}
    </span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink-subtle">{label}</p>
      <div className="mt-1.5 rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-ink">{children}</div>
    </div>
  );
}

function AgentBuilder() {
  return (
    <Panel title="New agent" meta={<Tag tone="brand">Draft</Tag>}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Agent name">Sales Qualifier</Field>
          <Field label="Objective">Book qualified demos</Field>
        </div>
        <Field label="Instructions">
          <span className="leading-relaxed text-ink-muted">
            You are a friendly sales assistant for Acme. Confirm the caller&apos;s needs, ask about team size and
            timeline, and offer a demo when they&apos;re a fit.
          </span>
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink-subtle">Languages</span>
          <Tag tone="brand">English</Tag>
          <Tag>Hindi</Tag>
          <Tag>Spanish</Tag>
        </div>
      </div>
    </Panel>
  );
}

const sources = [
  { name: "Product FAQ.pdf", icon: FileText, status: "Ready" },
  { name: "Pricing & plans page", icon: Globe, status: "Ready" },
  { name: "Support policies.docx", icon: FileText, status: "Processing" },
];

function Knowledge() {
  return (
    <Panel title="Knowledge sources" meta={<span className="text-xs text-ink-subtle">3 sources</span>}>
      <ul className="space-y-2">
        {sources.map(({ name, icon: Icon, status }) => (
          <li key={name} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
            <Icon className="size-4 text-ink-subtle" aria-hidden="true" />
            <span className="flex-1 truncate text-sm text-ink">{name}</span>
            {status === "Ready" ? (
              <Tag tone="success">
                <Check className="size-3" aria-hidden="true" /> Ready
              </Tag>
            ) : (
              <Tag>
                <Loader2 className="size-3" aria-hidden="true" /> Processing
              </Tag>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-xl bg-brand-softer p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-brand">
          <Sparkles className="size-3.5" aria-hidden="true" /> Grounded answer
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink">
          &ldquo;Yes — annual plans include priority support and onboarding.&rdquo;
        </p>
        <p className="mt-2 text-xs text-ink-subtle">Source: Pricing & plans page</p>
      </div>
    </Panel>
  );
}

function Calling() {
  return (
    <Panel title="Calling" meta={<Tag tone="success">2 active</Tag>}>
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-line p-4">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand-softer text-brand">
            <ArrowDownLeft className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">Inbound · Support line</p>
            <p className="truncate text-xs text-ink-subtle">+1 (555) 010-2040 → Support Agent</p>
          </div>
          <Waveform bars={4} className="h-3.5 text-brand" />
        </div>
        <div className="rounded-xl border border-line p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-navy text-white">
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">Outbound · Spring renewals</p>
              <p className="text-xs text-ink-subtle">Weekdays 10:00–18:00 · 2 retries</p>
            </div>
            <span className="text-sm font-semibold text-ink tabular-nums">62%</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full w-[62%] rounded-full bg-brand" />
          </div>
          <p className="mt-2 text-xs text-ink-subtle">310 of 500 leads called</p>
        </div>
      </div>
    </Panel>
  );
}

const actions = [
  { name: "check_availability", detail: "Thu 3:00 PM available", icon: CalendarCheck },
  { name: "book_meeting", detail: "Demo booked with Sarah", icon: CalendarCheck },
  { name: "update_crm", detail: "Lead stage → Qualified", icon: Database },
  { name: "send_webhook", detail: "call.outcome delivered", icon: Webhook },
];

function Actions() {
  return (
    <Panel title="Actions during call" meta={<span className="font-mono text-xs text-ink-subtle">00:02:41</span>}>
      <ol className="relative space-y-4">
        <span aria-hidden="true" className="absolute top-2 bottom-2 left-[15px] w-px bg-line" />
        {actions.map(({ name, detail, icon: Icon }) => (
          <li key={name} className="relative flex items-start gap-3">
            <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-brand-soft bg-white text-brand">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="font-mono text-[0.8125rem] font-medium text-ink">{name}</p>
              <p className="text-xs text-ink-muted">{detail}</p>
            </div>
            <Check className="mt-1.5 size-4 text-success" aria-label="Completed" />
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function Insights() {
  return (
    <Panel title="Call summary" meta={<span className="text-xs text-ink-subtle">Sarah Mitchell · 3:42</span>}>
      <div className="flex flex-wrap gap-2">
        <Tag tone="brand">Appointment</Tag>
        <Tag tone="success">Qualified</Tag>
        <Tag>Positive sentiment</Tag>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink">
        Wants to automate inbound support calls for a 12-person team. Evaluating options this quarter. Demo booked for
        Thursday at 3:00 PM.
      </p>
      <div className="mt-4 space-y-2 border-t border-line pt-4 text-[0.8125rem]">
        <p>
          <span className="font-semibold text-brand">Agent: </span>
          <span className="text-ink-muted">What are you mainly looking to automate?</span>
        </p>
        <p>
          <span className="font-semibold text-ink">Sarah: </span>
          <span className="text-ink-muted">Inbound customer calls, mostly.</span>
        </p>
      </div>
      <p className="mt-4 rounded-lg bg-surface-muted px-3 py-2 text-xs text-ink-muted">
        <span className="font-semibold text-ink">Next step:</span> Send demo prep email
      </p>
    </Panel>
  );
}

function Analytics() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Connect rate", value: "68%" },
          { label: "Avg. duration", value: "2:46" },
          { label: "Conversion", value: "21%" },
        ].map((metric) => (
          <div key={metric.label} className="rounded-xl border border-line bg-white p-3.5 shadow-card">
            <p className="text-[0.6875rem] font-medium text-ink-subtle sm:text-xs">{metric.label}</p>
            <p className="mt-1 text-lg font-semibold text-ink tabular-nums sm:text-xl">{metric.value}</p>
          </div>
        ))}
      </div>
      <WeeklyCallsChart data={demoWeeklyCalls} className="shadow-lift" title="Calls handled" />
    </div>
  );
}

const visuals: Record<FeatureStoryVisual, () => ReactNode> = {
  "agent-builder": AgentBuilder,
  knowledge: Knowledge,
  calling: Calling,
  actions: Actions,
  insights: Insights,
  analytics: Analytics,
};

export function StoryVisual({ visual }: { visual: FeatureStoryVisual }) {
  const Visual = visuals[visual];
  return <Visual />;
}
