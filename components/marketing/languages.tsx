import { callLanguages, languagesSection } from "@/config/languages";
import { Container } from "@/components/ui/container";

/**
 * The languages a call can be held in, written in their own scripts.
 *
 * The scripts carry the point better than the English names do: a Telugu
 * speaker reading తెలుగు on the page knows immediately that the call will not
 * be in English. The list mirrors what the voice engine reports, so it is
 * proof rather than a promise.
 */
export function Languages() {
  return (
    <section id={languagesSection.id} aria-labelledby="languages-heading" className="bg-cream py-28 lg:py-36">
      <Container>
        <div className="max-w-[52ch]">
          <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-accent-strong uppercase">
            {languagesSection.eyebrow}
          </p>
          <h2 id="languages-heading" className="mt-5 text-h2 font-semibold text-ink text-balance">
            {languagesSection.heading}
            <span className="block text-ink-muted">{languagesSection.subheading}</span>
          </h2>
          <p className="mt-4 text-lead text-ink-muted">{languagesSection.body}</p>
        </div>

        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {callLanguages.map((language) => (
            <li key={language.name} className="flex min-w-0 items-baseline justify-between gap-4 bg-surface px-5 py-4">
              <span className="min-w-0">
                <span className="block truncate text-[1.0625rem] font-semibold text-ink">{language.native}</span>
                <span className="block truncate text-sm text-ink-muted">{language.name}</span>
              </span>
              <span className="shrink-0 text-right text-xs text-ink-subtle">{language.region}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm text-ink-subtle">{languagesSection.note}</p>
      </Container>
    </section>
  );
}
