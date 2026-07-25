type ArticleJsonLdProps = {
  url: string;
  siteName: string;
  title: string;
  description: string;
  image?: string;
  authorName: string;
  publishedAt?: string | null;
  modifiedAt?: string | null;
};

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function ArticleJsonLd({
  url,
  siteName,
  title,
  description,
  image,
  authorName,
  publishedAt,
  modifiedAt,
}: ArticleJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    ...(image ? { image: [image] } : {}),
    datePublished: publishedAt ?? undefined,
    dateModified: modifiedAt ?? publishedAt ?? undefined,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(data) }}
    />
  );
}
