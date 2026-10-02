import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { SkipLink } from "@/components/layout/skip-link";
import { DocsMobileNav, DocsSidebar } from "@/components/docs/docs-nav";
import { Container } from "@/components/ui/container";

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  return (
    <>
      <SkipLink />
      <Navbar />
      <Container className="grid grid-cols-1 gap-8 py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 lg:py-16">
        <DocsSidebar />
        <div className="min-w-0">
          <DocsMobileNav />
          <main id="main" className="mt-8 max-w-3xl lg:mt-0">
            {children}
          </main>
        </div>
      </Container>
      <Footer />
    </>
  );
}
