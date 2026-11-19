import Link from "next/link";
import { footerColumns, routes, siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";

/**
 * The site footer: the mark and the one way to reach us on the left, then
 * three columns of hub links — product, solutions, company. The hubs reach
 * the rest (see the note on `footerColumns` in config/site.ts), so this stays
 * short enough not to outweigh the page above it.
 *
 * It is deliberately a plain server component — a list of links needs no
 * JavaScript — and the columns come from config/site.ts so the navigation and
 * the markup stay one thing.
 *
 * The ground is one ember surface on every page — see `.footer-ground` in
 * app/globals.css, which also redefines the ink tokens the markup below
 * resolves through. Nothing here needs to know which page it is under.
 */
export function Footer() {
  return (
    <footer className="footer-ground pt-14 pb-8 lg:pt-16">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-12">
          <div>
            <Logo />
            <p className="mt-5 text-[0.9375rem] text-ink-muted">
              <a
                href={`mailto:${siteConfig.email}`}
                className="underline decoration-current/30 underline-offset-4 transition-[text-decoration-color] hover:decoration-current"
              >
                {siteConfig.email}
              </a>
            </p>
            <p className="mt-2 max-w-[34ch] text-[0.9375rem] text-ink-subtle">
              AI voice agents that answer, qualify and book your inbound calls.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3">
            {footerColumns.map((column) => {
              // The group title names the list for a screen reader without
              // adding a heading: an <h2> per column in the footer of every page would
              // compete with the one heading each page is actually about.
              const titleId = `footer-${column.title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
              return (
                <div key={column.title}>
                  <p id={titleId} className="text-sm font-semibold text-ink">
                    {column.title}
                  </p>
                  <ul aria-labelledby={titleId} className="mt-4 space-y-2.5">
                    {column.links.map((link) => (
                      <li key={`${column.title}-${link.label}`}>
                        <Link
                          href={link.href}
                          className="text-[0.9375rem] text-ink-muted transition-colors hover:text-ink"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-ink-subtle">
            © {siteConfig.copyrightYear} {siteConfig.name} · AI voice agents
          </p>
          <p className="text-ink-subtle">
            <Link href={routes.privacy} className="font-medium text-ink transition-colors hover:text-ink-muted">
              Privacy
            </Link>
            {" · "}
            <Link href={routes.terms} className="font-medium text-ink transition-colors hover:text-ink-muted">
              Terms
            </Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}
