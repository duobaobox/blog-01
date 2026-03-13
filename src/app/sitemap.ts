export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getResolvedSiteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getResolvedSiteConfig();
  const baseUrl = site.url;

  const posts = await db.post.findMany({
    where: { status: "published" },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
  });

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
