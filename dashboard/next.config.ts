import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Dashboard pages render behind a client-side AuthGuard, so their content is
    // not in the server shell and every route is flagged. Only validate segments
    // that explicitly opt in with `export const instant`.
    instantInsights: {
      validationLevel: 'manual-warning',
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
