import { Check } from "lucide-react";
import type { PricingTier } from "@/types";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function PricingCard({ tier }: { tier: PricingTier }) {
  const highlighted = Boolean(tier.highlighted);
  return (
    <li
      className={cn(
        "reveal relative flex flex-col rounded-3xl border bg-white p-7 lg:p-8",
        highlighted ? "border-brand shadow-[0_24px_60px_-24px_rgb(37_99_235/0.45)] ring-4 ring-brand-softer" : "border-line",
      )}
    >
      {highlighted && (
        <span className="absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
          Recommended
        </span>
      )}
      <h3 className="text-xl font-semibold tracking-tight text-ink">{tier.name}</h3>
      <p className="mt-2 min-h-12 text-[0.9375rem] leading-relaxed text-ink-muted">{tier.description}</p>

      <div className="mt-6 flex items-baseline gap-1.5 border-b border-line pb-6">
        {tier.price ? (
          <>
            <span className="text-4xl font-semibold tracking-tight text-ink">{tier.price.amount}</span>
            <span className="text-sm text-ink-subtle">{tier.price.period}</span>
          </>
        ) : (
          <span className="text-3xl font-semibold tracking-tight text-ink">{tier.priceLabel}</span>
        )}
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-[0.9375rem] text-ink">
            <Check className="mt-0.5 size-[18px] shrink-0 text-brand" strokeWidth={2.25} aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>

      <ButtonLink
        href={tier.cta.href}
        variant={highlighted ? "primary" : "secondary"}
        size="lg"
        className="mt-8 w-full"
      >
        {tier.cta.label}
      </ButtonLink>
    </li>
  );
}
