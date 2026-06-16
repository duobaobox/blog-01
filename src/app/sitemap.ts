import type { MetadataRoute } from "next";
import { getPublicSitemapData } from "@/features/settings/queries/public-site-metadata.query";
import { joinSiteUrl } from "@/shared/lib/url";

// Next.js segment config must stay statically analyzable.
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { site, blogLastModified, posts, categories, tags } =
    await getPublicSitemapData();
  const baseUrl = site.url;

  const staticPages: MetadataRoute.Sitemap = [
    { url: joinSiteUrl(baseUrl), lastModified: site.updatedAt },
    { url: joinSiteUrl(baseUrl, "about"), lastModified: site.updatedAt },
    { url: joinSiteUrl(baseUrl, "projects"), lastModified: site.updatedAt },
    { url: joinSiteUrl(baseUrl, "blog"), lastModified: blogLastModified },
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: joinSiteUrl(baseUrl, `blog/${post.slug}`),
    lastModified: post.updatedAt,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: joinSiteUrl(baseUrl, `blog/categories/${cat.slug}`),
    lastModified: cat.updatedAt,
  }));

  const tagPages: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: joinSiteUrl(baseUrl, `blog/tags/${tag.slug}`),
    lastModified: tag.updatedAt,
  }));

  return [...staticPages, ...postPages, ...categoryPages, ...tagPages];
}
