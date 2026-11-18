import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The Reyvoca mark: five rounded bars of a voice, symmetrical, with the
 * centre one in ember. Drawn from the supplied artwork
 * (`public/brand/reyvoca-mark.png`) so it stays crisp at any size and can
 * take the ground it sits on — white bars on a dark surface with `inverse`,
 * ink bars on paper. There is no tile behind it; the mark is the bars.
 */
export function LogoMark({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <g className={inverse ? "fill-white" : "fill-ink"}>
        <rect x="1" y="12.87" width="3.92" height="7.22" rx="1.96" />
        <rect x="7.25" y="6.9" width="4.23" height="18.46" rx="2.12" />
        <rect x="20.47" y="7.04" width="4.23" height="18.36" rx="2.12" />
        <rect x="27.06" y="12.8" width="3.92" height="7.29" rx="1.96" />
      </g>
      <rect
        x="13.94"
        y="2.25"
        width="4.23"
        height="27.45"
        rx="2.12"
        className={inverse ? "fill-accent-glow" : "fill-accent"}
      />
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
