import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "inverse" | "inverse-outline";
type Size = "sm" | "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-200 disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover hover:-translate-y-px",
  secondary: "border border-line-strong bg-surface text-ink hover:border-ink/40 hover:bg-surface-muted hover:-translate-y-px",
  ghost: "text-ink-muted hover:text-ink hover:bg-surface-muted",
  inverse: "bg-surface text-ink hover:bg-surface-muted hover:-translate-y-px",
  "inverse-outline": "border border-white/30 bg-white/10 text-white hover:bg-white/20 hover:-translate-y-px",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-12 px-6 text-base",
};

type StyleProps = { variant?: Variant; size?: Size; className?: string };

export function buttonStyles({ variant = "primary", size = "md", className }: StyleProps = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonLinkProps = StyleProps & Omit<ComponentProps<typeof Link>, "className"> & { children: ReactNode };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />;
}

type ButtonProps = StyleProps & Omit<ComponentProps<"button">, "className">;

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}
