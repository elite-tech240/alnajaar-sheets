import type { NextConfig } from "next";

const supabaseHost = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://suxazqgoumbeqyazornz.supabase.co",
).hostname;

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }],
  },
  async redirects() {
    return [{ source: "/", destination: "/ar", permanent: false }];
  },
};

export default nextConfig;
