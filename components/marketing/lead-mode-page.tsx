import { leadModeHref, leadModes, type LeadMode } from "@/config/lead-modes";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/seo/json-ld";
import { Navbar } from "@/components/layout/navbar";
import { BookDemo } from "@/components/marketing/book-demo";
import { NightClose } from "@/components/marketing/night-close";
import { StepFlow } from "@/components/marketing/step-flow";
import {
  CallingListVisual,
  CallingVisual,
  LeadArrivesVisual,
  ProgressVisual,
  ResultVisual,
  UploadVisual,
} from "@/components/marketing/flow-visuals";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/** The drawing for each explainer step, by mode. Config carries no JSX. */
const EXPLAINER_VISUALS: Record<LeadMode["slug"], React.ReactNode[]> = {
  "instant-leads": [<LeadArrivesVisual key="a" />, <CallingVisual key="b" />, <ResultVisual key="c" />],
  "bulk-leads": [<UploadVisual key="a" />, <CallingListVisual key="b" />, <ProgressVisual key="c" />],
};

/**
 * One product page, shared by Instant Leads and Bulk Leads.
 *
 * Both pages answer the same three questions in the same order, because a
 * visitor clicking either item in the Products menu has the same ones: what
 * this actually is, what happens step by step, and where it lives once the
 * workspace is handed over. The comparison near the bottom then defines the
 * *other* mode too, so either click explains the pair.
 *
 * Everything is content from `config/lead-modes.ts` — the page holds layout
 * only, so the two definitions can never drift.
 */
export function LeadModePage({ mode }: { mode: LeadMode }) {
  const other = leadModes.find((item) => item.slug !== mode.slug)!;

  /**
   * Each mode is a service Reyvoca performs, so it is marked up as one — and
   * only with what the page actually says out loud.
   */
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Reyvoca ${mode.label}`,
    description: mode.metaDescription,
    serviceType: "AI voice agent calling",
    url: `${siteConfig.url}${leadModeHref(mode.slug)}`,
    areaServed: "IN",
    provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <Navbar />

      {/* ------------------------------------------------ opening */}
      <section className="bg-canvas pt-16 pb-20 lg:pt-20 lg:pb-24">
        <Container>
          <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-accent-strong uppercase">
            {mode.label}
          </p>
          <h1 className="mt-5 max-w-[22ch] text-h2 font-semibold text-ink text-balance">{mode.heading}</h1>
          <p className="mt-5 max-w-[48ch] text-lead font-medium text-ink">{mode.oneLine}</p>
          <p className="mt-3 max-w-[58ch] text-[1.0625rem] leading-relaxed text-ink-muted">{mode.intro}</p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ButtonLink href="#book-demo">Book a demo</ButtonLink>
            <ButtonLink href={leadModeHref(other.slug)} variant="secondary">
              See {other.label}
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------ the flow */}
      <section aria-labelledby="flow-heading" className="bg-canvas py-20 lg:py-28">
        <Container>
          <h2 id="flow-heading" className="max-w-[24ch] text-h3 font-semibold text-ink text-balance">
            {mode.flowLabel}, step by step
          </h2>

          {/* Three drawn steps rather than five written ones: the same story,
              shown. The illustrations are the ones the workspace itself uses,
              so the page and the product explain the module identically. */}
          <div className="mt-12">
            <StepFlow
              label={`${mode.flowLabel}, step by step`}
              steps={mode.explainer.map((step, index) => ({
                ...step,
                visual: EXPLAINER_VISUALS[mode.slug][index],
              }))}
            />
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------ the close */}
      {/* The ground the homepage's booking form stands on, and only that: the
          night, the lit glass card and the reveal, with none of the closing
          headline. <BookDemo tone="night"/> is transparent, so it reads on the
          dark instead of cutting back to paper the way the paper tone does. */}
      <NightClose>
        <BookDemo tone="night" />
      </NightClose>
    </>
  );
}
