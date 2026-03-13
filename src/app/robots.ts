import type { MetadataRoute } from "next";
import { getResolvedSiteConfig } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getResolvedSiteConfig();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/admin/",
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
