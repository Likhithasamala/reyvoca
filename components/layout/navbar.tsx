import { SiteNav } from "./site-nav";

/**
 * The bar for every page that is not the homepage.
 *
 * It is the same floating pill the homepage uses. There used to be a second,
 * light bar here, so the navigation changed shape, colour and contents the
 * moment you left the homepage — one site, two navbars. This renders the one
 * pill everywhere instead.
 *
 * The pill is `fixed`, so it takes no height in the flow; the spacer gives the
 * page back the space it would otherwise be sitting underneath. The homepage
 * renders <SiteNav /> directly, without the spacer, because its hero is drawn
 * to run up behind the pill.
 */
export function Navbar() {
  return (
    <>
      <SiteNav />
      <div aria-hidden="true" className="h-15" />
    </>
  );
}
