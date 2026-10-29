import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Temporary Reyvoca mark: an ink square carrying a voice waveform with one
 * ember bar. `inverse` swaps to a raised night tile with a hairline border
 * so the mark stays visible on dark surfaces.
 */
export function LogoMark({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="8.5"
        className={inverse ? "fill-night-raised stroke-night-line" : "fill-brand stroke-brand"}
      />
      <g className="fill-surface">
        <rect x="7" y="13.5" width="2.6" height="5" rx="1.3" />
        <rect x="11.6" y="9.5" width="2.6" height="13" rx="1.3" />
        <rect x="16.2" y="6.5" width="2.6" height="19" rx="1.3" className="fill-accent-glow" />
        <rect x="20.8" y="11" width="2.6" height="10" rx="1.3" opacity="0.85" />
        <rect x="25.4" y="14" width="2" height="4" rx="1" opacity="0.7" />
      </g>
    </svg>
  );
}

type LogoProps = { href?: string; className?: string; inverse?: boolean };

export function Logo({ href = "/", className, inverse = false }: LogoProps) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="Reyvoca home">
      <LogoMark inverse={inverse} />
      <span className={cn("text-[1.1875rem] font-semibold tracking-[-0.02em]", inverse ? "text-white" : "text-ink")}>
        Reyvoca
      </span>
    </Link>
  );
}
