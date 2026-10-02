import type { Feature } from "@/types";
import { IconTile } from "@/components/ui/icon-tile";
import { Waveform } from "@/components/ui/waveform";
import { cn } from "@/lib/cn";

const providerSlots = [
  { label: "LLM", choice: "Your choice" },
  { label: "Speech-to-text", choice: "Your choice" },
  { label: "Text-to-speech", choice: "Your choice" },
  { label: "Telephony", choice: "Your choice" },
];

function VoiceVisual() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-muted p-3">
      <span className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-ink-muted shadow-card">Caller</span>
      <Waveform bars={7} active={false} className="h-5 text-line-strong" />
      <span className="h-px flex-1 bg-line-strong" />
      <Waveform bars={7} className="h-5 text-brand" />
      <span className="rounded-lg bg-brand px-2.5 py-1.5 text-xs font-medium text-white">Agent</span>
    </div>
  );
}

function ProvidersVisual() {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {providerSlots.map((slot) => (
        <li key={slot.label} className="rounded-xl border border-line bg-surface-muted px-3 py-2.5">
          <p className="text-[0.6875rem] font-semibold tracking-wide text-ink-subtle uppercase">{slot.label}</p>
          <p className="mt-0.5 text-sm font-medium text-brand">{slot.choice}</p>
        </li>
      ))}
    </ul>
  );
}

export function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <li
      className={cn(
        "reveal group flex flex-col rounded-2xl border border-line bg-white p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-brand-soft hover:shadow-lift",
        feature.wide && "sm:col-span-2",
      )}
    >
      <IconTile icon={feature.icon} />
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">{feature.title}</h3>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">{feature.description}</p>
      {feature.visual && (
        <div aria-hidden="true" className="mt-6 lg:mt-auto lg:pt-6">
          {feature.visual === "voice" ? <VoiceVisual /> : <ProvidersVisual />}
        </div>
      )}
    </li>
  );
}
