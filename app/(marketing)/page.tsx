import { siteConfig } from "@/config/site";
import { industries } from "@/config/industries";
import { callLanguages } from "@/config/languages";
import { SiteNav } from "@/components/layout/site-nav";
import { AgentTraits } from "@/components/marketing/agent-traits";
import { BookDemo } from "@/components/marketing/book-demo";
import { CallAnatomy } from "@/components/marketing/call-anatomy";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Industries } from "@/components/marketing/industries";
import { Languages } from "@/components/marketing/languages";
import { Lights } from "@/components/marketing/lights";
import { Opening } from "@/components/marketing/opening";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({ path: "/" });

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.svg`,
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${siteConfig.name} AI voice agents`,
    provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    areaServed: "IN",
    availableLanguage: callLanguages.map((language) => language.name),
    serviceType: industries.map((industry) => `AI voice agent for ${industry.name.toLowerCase()}`),
  },
];

/**
 * The homepage runs the argument in the order a buyer meets it: the enquiry
 * that needs calling, how that gets handled, what the agent is actually like
 * on a call, who it is for, and the languages it holds the call in — then it
 * asks for the demo.
 *
 * There is no pricing section. Reyvoca is sold on a call, with a rate quoted
 * against real volume, so the page converts to one place only.
 */
export default function HomePage() {
  return (
    <>
      <JsonLd data={structuredData} />
      <SiteNav />
      <Opening />
      <Lights />
      <HowItWorks />
      <CallAnatomy />
      <AgentTraits />
      <Industries />
      <Languages />
      <Faq />
      <FinalCta />
      <BookDemo />
    </>
  );
}
