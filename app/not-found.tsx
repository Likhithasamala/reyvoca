import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main id="main" className="relative isolate flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <Logo />
      <p className="mt-12 text-sm font-semibold text-accent-strong">404</p>
      <h1 className="mt-3 text-h2 font-semibold text-ink">This page doesn&apos;t exist.</h1>
      <p className="mt-4 max-w-md text-lead text-ink-muted">The link may be broken, or the page may have moved.</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/">Back to home</ButtonLink>
        <ButtonLink href="/docs" variant="secondary">
          Read the Docs
        </ButtonLink>
      </div>
    </main>
  );
}
