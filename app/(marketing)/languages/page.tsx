import { callLanguages } from "@/config/languages";
import { Navbar } from "@/components/layout/navbar";
import { BookDemo } from "@/components/marketing/book-demo";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { routes } from "@/config/site";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "AI voice agents in 11 Indian languages",
  description:
    "Reyvoca agents hold calls in English, Hindi, Telugu, Tamil, Kannada, Marathi, Bengali, Gujarati, Malayalam, Punjabi and Odia — and switch language mid-call.",
  path: "/languages",
});

export default function LanguagesPage() {
  return (
    <>
      <Navbar />
      <section className="bg-canvas pt-16 pb-24 lg:pt-20 lg:pb-32">
        <Container>
          <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-accent-strong uppercase">Languages</p>
          <h1 className="mt-5 max-w-[20ch] text-h2 font-semibold text-ink text-balance">
            A customer who is answered in their own language stays on the call.
          </h1>
          <p className="mt-6 max-w-[62ch] text-lead text-ink-muted">
            Reyvoca agents hold a conversation in {callLanguages.length} languages. You choose the one a call opens in
            and the ones it may move to. When a caller answers in another of them, the agent follows — the voice and the
            listening both change, not just the words on screen.
          </p>

          <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
            {callLanguages.map((language) => (
              <li key={language.name} className="min-w-0 bg-surface px-6 py-5">
                <p className="text-2xl font-semibold text-ink">{language.native}</p>
                <p className="mt-1 text-[0.9375rem] font-medium text-ink-muted">{language.name}</p>
                <p className="mt-0.5 text-xs text-ink-subtle">{language.region}</p>
              </li>
            ))}
          </ul>

          <div className="mt-14 grid gap-10 border-t border-line pt-12 sm:grid-cols-2">
            <div className="min-w-0">
              <h2 className="text-[1.0625rem] font-semibold text-ink">Switching happens mid-sentence</h2>
              <p className="mt-2.5 max-w-[48ch] text-[0.9375rem] leading-relaxed text-ink-muted">
                A caller who opens in English and drops into Telugu halfway does not have to repeat themselves. The
                agent detects the change, answers in that language, and stays there for the rest of the call.
              </p>
            </div>
            <div className="min-w-0">
              <h2 className="text-[1.0625rem] font-semibold text-ink">You set the boundaries</h2>
              <p className="mt-2.5 max-w-[48ch] text-[0.9375rem] leading-relaxed text-ink-muted">
                Each agent has a starting language and a list it is allowed to use. Outside that list it stays put —
                useful when a script has been approved in two languages and nobody wants a third.
              </p>
            </div>
          </div>

          <ButtonLink href={routes.bookDemo} size="sm" className="mt-12">
            Hear it in your language
          </ButtonLink>
        </Container>
      </section>
      <BookDemo />
    </>
  );
}
