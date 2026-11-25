import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** Static artwork rarely changes: let browsers and the edge cache it. */
const ASSET_CACHE = "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  async headers() {
    return ["/assets/:path*", "/themes/:path*", "/avatars/:path*", "/backgrounds/:path*", "/quran/:path*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: ASSET_CACHE }],
    }));
  },
};

// Cloudflare bindings are needed by the Next.js dev server, not production builds.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

export default nextConfig;
