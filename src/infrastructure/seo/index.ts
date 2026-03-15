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

function resolveAbsoluteUrl(baseUrl: string, value?: string) {
  if (!value) return undefined;

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
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
  const siteUrl = resolveAbsoluteUrl(site.url, url) ?? site.url;
  const imageUrl = resolveAbsoluteUrl(site.url, image);

  return {
    title: siteTitle,
    description: siteDescription,
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      url: siteUrl,
      siteName: site.name,
      type,
      ...(imageUrl && { images: [{ url: imageUrl }] }),
      ...(publishedTime && { publishedTime }),
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      ...(imageUrl && { images: [imageUrl] }),
    },
    alternates: {
      canonical: siteUrl,
    },
  };
}
