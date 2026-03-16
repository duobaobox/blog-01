import type { MetadataRoute } from "next";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import { joinSiteUrl } from "@/shared/lib/url";

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
    sitemap: joinSiteUrl(site.url, "sitemap.xml"),
  };
}
