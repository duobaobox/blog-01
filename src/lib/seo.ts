import type { Metadata } from "next";
import { siteConfig } from "@/site.config";

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
}

export function generateSeo({
  title,
  description,
  image,
  url,
  type = "website",
  publishedTime,
}: SeoProps = {}): Metadata {
  const siteTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const siteDescription = description || siteConfig.description;
  const siteUrl = url || siteConfig.url;

  return {
    title: siteTitle,
    description: siteDescription,
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      url: siteUrl,
      siteName: siteConfig.name,
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
