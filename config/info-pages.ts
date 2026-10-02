/**
 * Simple informational pages linked from the footer. They are honest
 * placeholders until real content (and real legal text) exists.
 */
import type { InfoPage } from "@/types";

export const infoPages: InfoPage[] = [
  {
    slug: "about",
    title: "About Reyvoca",
    description: "We're building AI voice agents for real business conversations.",
    body: [
      "Reyvoca is building a platform where businesses can create AI voice agents that speak naturally with customers, take action in the tools they already use, and capture what happened on every call.",
      "We're early. This site is the first step, and the platform is being built in the open phase by phase.",
    ],
  },
  {
    slug: "contact",
    title: "Contact",
    description: "Talk to the Reyvoca team about your voice agent use case.",
    body: [
      "We're speaking with teams interested in early access and enterprise deployments.",
      "A contact form is on the way. In the meantime, the docs describe what we're building and how the platform will work.",
    ],
  },
  {
    slug: "careers",
    title: "Careers",
    description: "Help build the future of AI voice conversations.",
    body: ["We don't have open roles listed yet. Check back soon."],
  },
  {
    slug: "status",
    title: "System Status",
    description: "Service status for the Reyvoca platform.",
    body: [
      "Reyvoca's calling platform is not yet live, so there are no services to report on.",
      "A public status page will be available here when the platform launches.",
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "How Reyvoca will handle personal data.",
    body: [
      "Our privacy policy is being prepared and will be published here before Reyvoca accepts customer data.",
      "This marketing website does not currently collect account information — sign-in and sign-up forms are not yet connected to a backend.",
    ],
  },
  {
    slug: "terms",
    title: "Terms of Service",
    description: "The terms that will govern use of Reyvoca.",
    body: ["Terms of service will be published here before Reyvoca opens accounts to customers."],
  },
  {
    slug: "security",
    title: "Security",
    description: "Our approach to securing the Reyvoca platform.",
    body: [
      "Security is a design requirement for a platform that handles customer conversations. We'll publish details of our security practices here as the platform is built.",
      "Reyvoca does not currently hold any security certifications.",
    ],
  },
];

export const getInfoPage = (slug: string) => infoPages.find((page) => page.slug === slug);
