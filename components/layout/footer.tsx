import Link from "next/link";
import { routes, siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";

const footerLinks = [
  { label: "Docs", href: routes.docs },
  { label: "Contact", href: routes.contact },
  { label: "Terms", href: routes.terms },
];

/**
 * A single quiet line after a long stretch of ground: what this is, a few
 * links, the year and privacy. No block, no rule, no columns.
 */
export function Footer() {
  return (
    <footer className="bg-surface pt-20 pb-7">
      <Container className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-baseline">
        <p className="text-ink-subtle">{siteConfig.name} · AI voice agents</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-6 sm:justify-center">
          {footerLinks.map((link) => (
            <Link key={link.label} href={link.href} className="font-medium text-ink transition-colors hover:text-ink-muted">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-ink-subtle sm:text-right">
          © {siteConfig.copyrightYear} ·{" "}
          <Link href={routes.privacy} className="font-medium text-ink transition-colors hover:text-ink-muted">
            Privacy
          </Link>
        </p>
      </Container>
    </footer>
  );
}
