import { faq } from "@/config/marketing";
import { siteConfig } from "@/config/site";
import { Faq } from "@/components/marketing/faq";
import { FeatureStories } from "@/components/marketing/feature-stories";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Integrations } from "@/components/marketing/integrations";
import { Pricing } from "@/components/marketing/pricing";
import { ProductExperience } from "@/components/marketing/product-experience";
import { SocialProof } from "@/components/marketing/social-proof";
import { UseCases } from "@/components/marketing/use-cases";
import { WhyReyvoca } from "@/components/marketing/why-reyvoca";
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
    "@type": "FAQPage",
    mainEntity: faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={structuredData} />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <WhyReyvoca />
      <UseCases />
      <ProductExperience />
      <FeatureStories />
      <Integrations />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  );
}
