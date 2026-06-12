import type { MetadataRoute } from "next";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import { getPublishedSlugs } from "@/features/posts/queries/post.queries";
import { getCategories } from "@/features/taxonomy/queries/category.queries";
import { getTags } from "@/features/taxonomy/queries/tag.queries";
import { joinSiteUrl } from "@/shared/lib/url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getResolvedSiteConfig();
  const baseUrl = site.url;

  const [posts, categories, tags] = await Promise.all([
    getPublishedSlugs(),
    getCategories("public"),
    getTags("public"),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: joinSiteUrl(baseUrl), lastModified: new Date() },
    { url: joinSiteUrl(baseUrl, "about"), lastModified: new Date() },
    { url: joinSiteUrl(baseUrl, "projects"), lastModified: new Date() },
    { url: joinSiteUrl(baseUrl, "blog"), lastModified: new Date() },
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: joinSiteUrl(baseUrl, `blog/${post.slug}`),
    lastModified: post.updatedAt,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: joinSiteUrl(baseUrl, `blog/categories/${cat.slug}`),
    lastModified: new Date(),
  }));

  const tagPages: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: joinSiteUrl(baseUrl, `blog/tags/${tag.slug}`),
    lastModified: new Date(),
  }));

  return [...staticPages, ...postPages, ...categoryPages, ...tagPages];
}
