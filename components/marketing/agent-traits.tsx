import { agentSection } from "@/config/marketing";
import { Container } from "@/components/ui/container";

/**
 * Four behaviours that separate a voice agent from a phone menu.
 *
 * Every one of these is a real property of the call loop — turn-taking,
 * barge-in, mid-call language switching, and refusing to answer outside its
 * instructions. Nothing here is a claim the product cannot make.
 */
export function AgentTraits() {
  return (
    <section id={agentSection.id} aria-labelledby="agent-heading" className="bg-accent-wash py-20 lg:py-24">
      <Container>
        <div className="max-w-[52ch]">
          <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-accent-strong uppercase">
            {agentSection.eyebrow}
          </p>
          <h2 id="agent-heading" className="mt-5 text-h2 font-semibold text-ink text-balance">
            {agentSection.heading}
          </h2>
        </div>

        <ul className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:mt-16">
          {agentSection.points.map((point) => (
            <li key={point.title} className="min-w-0 border-t border-line pt-5">
              <h3 className="text-[1.0625rem] font-semibold text-ink text-balance">{point.title}</h3>
              <p className="mt-2.5 max-w-[46ch] text-[0.9375rem] leading-relaxed text-ink-muted">{point.detail}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
