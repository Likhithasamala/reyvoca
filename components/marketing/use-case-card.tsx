import type { UseCase } from "@/types";

export function UseCaseCard({ useCase }: { useCase: UseCase }) {
  const { icon: Icon } = useCase;
  return (
    <li className="reveal group relative overflow-hidden rounded-2xl border border-line bg-surface p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift">
      <span
        aria-hidden="true"
        className="absolute -top-10 -right-10 size-28 rounded-full bg-accent-wash opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span
        aria-hidden="true"
        className="relative inline-flex size-11 items-center justify-center rounded-xl bg-brand text-white transition-colors duration-300 group-hover:text-accent-glow"
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <h3 className="relative mt-5 text-lg font-semibold tracking-tight text-ink">{useCase.title}</h3>
      <p className="relative mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">{useCase.description}</p>
    </li>
  );
}
