import { getPublicFeedData } from "@/features/settings/queries/public-site-metadata.query";
import { joinSiteUrl } from "@/shared/lib/url";
import { escapeXml, wrapXmlCdata } from "@/shared/lib/xml";

// Next.js segment config must stay statically analyzable.
export const revalidate = 300;

export async function GET() {
  const { site, posts } = await getPublicFeedData(20);
  const baseUrl = site.url;

  const items = posts
    .map((post) => {
      const description = post.excerpt ?? post.contentText.slice(0, 200);
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : new Date().toUTCString();

      const postUrl = joinSiteUrl(baseUrl, `blog/${post.slug}`);

      return `    <item>
      <title>${wrapXmlCdata(post.title)}</title>
      <link>${escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <description>${wrapXmlCdata(description)}</description>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(post.author.name)}</author>
    </item>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${escapeXml(joinSiteUrl(baseUrl))}</link>
    <description>${escapeXml(site.description)}</description>
    <language>zh-CN</language>
    <atom:link href="${escapeXml(joinSiteUrl(baseUrl, "feed.xml"))}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
