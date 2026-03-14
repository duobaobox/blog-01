export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import { getPublishedSlugs } from "@/features/posts/queries/post.queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getResolvedSiteConfig();
  const baseUrl = site.url;

  const posts = await getPublishedSlugs();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/about`, lastModified: new Date() },
    { url: `${baseUrl}/projects`, lastModified: new Date() },
    { url: `${baseUrl}/blog`, lastModified: new Date() },
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
  }));

  return [...staticPages, ...postPages];
}
