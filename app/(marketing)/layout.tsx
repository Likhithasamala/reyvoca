import { Footer } from "@/components/layout/footer";
import { SkipLink } from "@/components/layout/skip-link";

/**
 * The homepage carries its own bar inside the dark stage, so the layout adds
 * no navigation of its own. Pages that need one render <Navbar /> themselves.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
