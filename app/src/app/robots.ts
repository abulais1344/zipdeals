import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://zipdeals.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/browse", "/listings/", "/sellers/"],
        disallow: ["/admin", "/api", "/sold"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}