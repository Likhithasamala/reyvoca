import Link from "next/link";
import { mainNav, routes } from "@/config/site";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { MobileMenu } from "./mobile-menu";
import { NavbarShell } from "./navbar-shell";

export function Navbar() {
  return (
    <NavbarShell>
      <Container className="flex h-14 items-center justify-between gap-6 lg:h-[60px]">
        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="rounded-full px-3.5 py-1.5 text-[0.9375rem] font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink href={routes.signIn} variant="ghost" size="sm">
            Sign In
          </ButtonLink>
          <ButtonLink href={routes.bookDemo} size="sm">
            Book a demo
          </ButtonLink>
        </div>

        <MobileMenu links={mainNav} />
      </Container>
    </NavbarShell>
  );
}
