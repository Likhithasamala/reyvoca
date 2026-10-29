import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { Waveform } from "@/components/ui/waveform";

const highlights = [
  "Design agents for sales, support and scheduling",
  "Ground every answer in your own knowledge",
  "Capture transcripts and outcomes for every call",
];

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Split-screen layout shared by sign in, sign up and password reset. */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative isolate hidden overflow-hidden bg-night p-12 text-white lg:flex lg:flex-col xl:p-16">
        <div
          aria-hidden="true"
          className="night-glow absolute inset-0 -z-10"
        />
        <div aria-hidden="true" className="grid-lines absolute inset-0 -z-10 opacity-60 invert" />
        <Logo inverse />

        <div className="my-auto max-w-md py-16">
          <Waveform bars={7} className="h-8 text-accent-glow" />
          <p className="mt-8 text-[2.25rem] leading-[1.12] font-semibold tracking-[-0.03em] text-balance">
            AI voice agents for real business conversations.
          </p>
          <ul className="mt-10 space-y-4">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-night-text">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-night-line text-accent-glow">
                  <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-night-muted">Reyvoca is in early development. Accounts open soon.</p>
      </aside>

      <main id="main" className="flex flex-col bg-canvas px-5 py-8 sm:px-8 lg:px-12">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.025em] text-ink">{title}</h1>
          <p className="mt-2 text-ink-muted">{description}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-ink-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
