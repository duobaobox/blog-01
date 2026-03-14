import type { Metadata } from "next";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
}

export async function generateSeo({
  title,
  description,
  image,
  url,
  type = "website",
  publishedTime,
}: SeoProps = {}): Promise<Metadata> {
  const site = await getResolvedSiteConfig();
  const siteTitle = title ? `${title} | ${site.name}` : site.name;
  const siteDescription = description || site.description;
  const siteUrl = url || site.url;

  return {
    title: siteTitle,
    description: siteDescription,
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      url: siteUrl,
      siteName: site.name,
      type,
      ...(image && { images: [{ url: image }] }),
      ...(publishedTime && { publishedTime }),
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      ...(image && { images: [image] }),
    },
    alternates: {
      canonical: siteUrl,
    },
  };
}
