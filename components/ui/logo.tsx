import Link from "next/link";
import { cn } from "@/lib/cn";

/** Temporary Reyvoca mark: a voice waveform inside a rounded blue square. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" fill="#2563EB" />
      <g fill="#fff">
        <rect x="7" y="13.5" width="2.6" height="5" rx="1.3" />
        <rect x="11.6" y="9.5" width="2.6" height="13" rx="1.3" />
        <rect x="16.2" y="6.5" width="2.6" height="19" rx="1.3" />
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
      <LogoMark />
      <span className={cn("text-[1.1875rem] font-semibold tracking-[-0.02em]", inverse ? "text-white" : "text-ink")}>
        Reyvoca
      </span>
    </Link>
  );
}
