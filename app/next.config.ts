import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "alfzskhojwxuevrnvenp.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
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
