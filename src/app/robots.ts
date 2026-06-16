import type { MetadataRoute } from "next";
import { getPublicRobotsData } from "@/features/settings/queries/public-site-metadata.query";
import { joinSiteUrl } from "@/shared/lib/url";

// Next.js segment config must stay statically analyzable.
export const revalidate = 300;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { site } = await getPublicRobotsData();

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
