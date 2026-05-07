import type { NextConfig } from "next";

const configuredSupabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const allowedImageHosts = Array.from(
  new Set(
    [
      configuredSupabaseHost,
      "alfzskhojwxuevrnvenp.supabase.co",
      "nwuhcujyfnywqccvrroe.supabase.co",
    ].filter((host): host is string => Boolean(host))
  )
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: allowedImageHosts.map((hostname) => ({
      protocol: "https",
      hostname,
      pathname: "/storage/v1/object/public/**",
    })),
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.zipdeals.in" }],
        destination: "https://zipdeals.in/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
