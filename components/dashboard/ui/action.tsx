import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Dashboard buttons. Squarer and smaller than the marketing pill buttons:
 * product UI needs density, the landing page needs presence.
 */
type Variant = "primary" | "accent" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  /**
   * Ember fill for a page's single primary action. Uses accent-strong rather
   * than accent so white text clears 4.5:1, and hovers on elevation instead of
   * colour so the contrast holds in every state.
   */
  accent: "bg-accent-strong text-white shadow-cta hover:shadow-cta-hover",
  secondary: "border border-line-strong bg-surface text-ink hover:border-ink-subtle hover:bg-surface-muted",
  ghost: "text-ink-muted hover:bg-surface-muted hover:text-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[0.8125rem]",
  md: "h-9 px-3.5 text-sm",
  /** Page-level primary action, e.g. the single CTA on a calling page. */
  lg: "h-11 px-7 text-[0.9375rem]",
};

type StyleProps = { variant?: Variant; size?: Size; className?: string };

export function actionStyles({ variant = "primary", size = "md", className }: StyleProps = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ActionLinkProps = StyleProps & Omit<ComponentProps<typeof Link>, "className"> & { children: ReactNode };

export function ActionLink({ variant, size, className, ...props }: ActionLinkProps) {
  return <Link className={actionStyles({ variant, size, className })} {...props} />;
}

type ActionProps = StyleProps & Omit<ComponentProps<"button">, "className">;

export function Action({ variant, size, className, type = "button", ...props }: ActionProps) {
  return <button type={type} className={actionStyles({ variant, size, className })} {...props} />;
}
