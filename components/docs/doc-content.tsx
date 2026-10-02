import { Info } from "lucide-react";
import type { DocBlock, DocPage } from "@/types";

function Block({ block }: { block: DocBlock }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "h2":
      return <h2 className="pt-4 text-2xl font-semibold tracking-tight text-ink">{block.text}</h2>;
    case "list":
      return (
        <ul className="list-disc space-y-2 pl-5 marker:text-brand">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <aside className="flex gap-3 rounded-xl border border-brand-soft bg-brand-softer p-4 text-[0.9375rem] text-ink">
          <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
          <p>{block.text}</p>
        </aside>
      );
    case "code":
      return (
        <pre
          tabIndex={0}
          aria-label={`${block.language} example`}
          className="overflow-x-auto rounded-xl bg-panel p-5 font-mono text-sm leading-relaxed text-slate-200"
        >
          <code>{block.code}</code>
        </pre>
      );
  }
}

export function DocContent({ page }: { page: DocPage }) {
  return (
    <article>
      <h1 className="text-h3 font-semibold text-ink">{page.title}</h1>
      <p className="mt-3 text-lead text-ink-muted">{page.description}</p>
      <div className="mt-10 space-y-6 border-t border-line pt-10 text-[1.0625rem] leading-relaxed text-ink-muted">
        {page.blocks.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </div>
    </article>
  );
}
