import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import { getPublishedForFeed } from "@/features/posts/queries/post.queries";
import { joinSiteUrl } from "@/shared/lib/url";

export async function GET() {
  const site = await getResolvedSiteConfig();
  const baseUrl = site.url;

  const posts = await getPublishedForFeed(20);

  const items = posts
    .map((post) => {
      const description = post.excerpt ?? post.contentText.slice(0, 200);
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : new Date().toUTCString();

      return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${joinSiteUrl(baseUrl, `blog/${post.slug}`)}</link>
      <guid isPermaLink="true">${joinSiteUrl(baseUrl, `blog/${post.slug}`)}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <author>${post.author.name}</author>
    </item>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${site.name}</title>
    <link>${joinSiteUrl(baseUrl)}</link>
    <description>${site.description}</description>
    <language>zh-CN</language>
    <atom:link href="${joinSiteUrl(baseUrl, "feed.xml")}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "no-store",
    },
  });
}
