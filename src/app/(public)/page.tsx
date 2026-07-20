import { HomeFeaturedPosts } from "@/features/home/components/home-featured-posts";
import { HomeHero } from "@/features/home/components/home-hero";
import { homeConfig } from "@/features/home/config/home.config";
import { getHomepageFeaturedOrLatestPosts } from "@/features/posts/queries/post.queries";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import { generateSeo } from "@/infrastructure/seo";

export const revalidate = 300;

export async function generateMetadata() {
  return generateSeo({ url: "/" });
}

export default async function HomePage() {
  const [site, homepagePosts] = await Promise.all([
    getResolvedSiteConfig(),
    getHomepageFeaturedOrLatestPosts(
      homeConfig.sections.featuredPosts.limit,
    ),
  ]);

  return (
    <div className="home-page-surface relative isolate min-h-full flex-auto shrink-0 overflow-hidden">
      {homeConfig.sections.hero.enabled ? (
        <HomeHero
          site={site}
          config={homeConfig.sections.hero}
          highlightedPost={homepagePosts.posts[0]}
          postSource={homepagePosts.source}
        />
      ) : null}

      <div className="relative">
        <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9">
          {homeConfig.sections.featuredPosts.enabled ? (
            <HomeFeaturedPosts
              posts={homepagePosts.posts}
              source={homepagePosts.source}
              config={homeConfig.sections.featuredPosts}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
