export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import { getPublishedSlugs } from "@/features/posts/queries/post.queries";
import { getCategories } from "@/features/taxonomy/queries/category.queries";
import { getTags } from "@/features/taxonomy/queries/tag.queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getResolvedSiteConfig();
  const baseUrl = site.url;

  const [posts, categories, tags] = await Promise.all([
    getPublishedSlugs(),
    getCategories("public"),
    getTags("public"),
  ]);

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

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/blog/categories/${cat.slug}`,
    lastModified: new Date(),
  }));

  const tagPages: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${baseUrl}/blog/tags/${tag.slug}`,
    lastModified: new Date(),
  }));

  return [...staticPages, ...postPages, ...categoryPages, ...tagPages];
}
