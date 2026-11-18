import Link from "next/link";
import { ArrowRight, BrainCircuit, Mic, Volume2 } from "lucide-react";
import { PageHeader } from "@/components/panel/page-header";
import { providerLabel } from "@/lib/agents/templates";
import { read } from "@/lib/server/db";
import { resolveEngine } from "@/lib/server/engine";
import { PLATFORM_WORKSPACE_ID } from "@/lib/server/scope";

export const metadata = { title: "Overview" };

/**
 * What every customer call is currently running on.
 *
 * This is the one place in Reyvoca where the vendors are named. The customer
 * dashboard shows the same three legs as "live" or "pending" and nothing more.
 */
export default async function AdminOverviewPage() {
  const engine = await resolveEngine(PLATFORM_WORKSPACE_ID);
  const keys = await read((db) =>
    db.providerConfigs
      .filter((row) => row.workspaceId === PLATFORM_WORKSPACE_ID)
      .map((row) => ({ type: row.providerType, name: row.providerName })),
  );

  const countFor = (type: "llm" | "stt" | "tts") => keys.filter((key) => key.type === type).length;

  const legs = [
    {
      icon: BrainCircuit,
      label: "Conversation",
      detail: "Answers the caller, follows the agent's instructions.",
      provider: engine.llmProvider,
      extra: engine.llmModel,
      keys: countFor("llm"),
    },
    {
      icon: Mic,
      label: "Speech recognition",
      detail: "Turns what the caller says into text.",
      provider: engine.sttProvider,
      extra: "",
      keys: countFor("stt"),
    },
    {
      icon: Volume2,
      label: "Voice synthesis",
      detail: "Speaks the agent's replies in the chosen voice.",
      provider: engine.voiceProvider,
      extra: "",
      keys: countFor("tts"),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Platform engine"
        description="The stack behind every customer call. Customers see these three legs as live or pending — never which vendor serves them."
      />

      <div className="space-y-2.5">
        {legs.map(({ icon: Icon, label, detail, provider, extra, keys: count }) => (
          <div
            key={label}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-4 sm:flex-nowrap sm:p-5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-muted text-ink">
              <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-ink">{label}</h2>
              <p className="text-xs leading-relaxed text-ink-muted">{detail}</p>
            </div>
            <div className="shrink-0 text-right">
              {provider ? (
                <>
                  <p className="text-sm font-medium text-ink">
                    {providerLabel(provider)}
                    {extra && <span className="text-ink-muted"> · {extra}</span>}
                  </p>
                  <p className="text-xs text-ink-subtle">
                    {count} key{count !== 1 ? "s" : ""} saved
                  </p>
                </>
              ) : (
                <p className="inline-flex items-center rounded-full border border-line bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted">
                  Not connected
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/admin/providers"
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
      >
        Manage provider keys
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
