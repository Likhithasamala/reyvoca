import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Serve the site on one hostname only.
   *
   * Both reyvoca.in and www.reyvoca.in resolve to the same deployment, so
   * without this every page exists at two URLs. The canonical tag already
   * points at the apex, but a 308 is the unambiguous signal: it keeps search
   * engines off the duplicate, and sends any link to www to the real page.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.reyvoca.in" }],
        destination: "https://reyvoca.in/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
