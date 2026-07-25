import type { Metadata } from "next";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  imageAlt?: string;
}

function resolveAbsoluteUrl(baseUrl: string, value?: string) {
  if (!value) return undefined;

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function resolveCanonicalUrl(baseUrl: string, value?: string) {
  const resolved = resolveAbsoluteUrl(baseUrl, value);
  if (!resolved) return undefined;

  try {
    const base = new URL(baseUrl);
    const candidate = new URL(resolved);
    return candidate.origin === base.origin ? candidate.toString() : undefined;
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
  modifiedTime,
  imageAlt,
}: SeoProps = {}): Promise<Metadata> {
  const site = await getResolvedSiteConfig();
  const pageTitle = title?.trim() || undefined;
  const socialTitle = pageTitle ? `${pageTitle} | ${site.name}` : site.name;
  const siteDescription = description || site.description;
  const siteUrl = resolveCanonicalUrl(site.url, url) ?? site.url;
  const imageUrl = resolveAbsoluteUrl(site.url, image);

  return {
    ...(pageTitle ? { title: pageTitle } : {}),
    description: siteDescription,
    openGraph: {
      title: socialTitle,
      description: siteDescription,
      url: siteUrl,
      siteName: site.name,
      type,
      ...(imageUrl && {
        images: [{ url: imageUrl, ...(imageAlt ? { alt: imageAlt } : {}) }],
      }),
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: siteDescription,
      ...(imageUrl && { images: [imageUrl] }),
    },
    alternates: {
      canonical: siteUrl,
    },
  };
}
