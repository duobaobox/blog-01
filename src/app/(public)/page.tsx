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
    <>
      {homeConfig.sections.hero.enabled ? (
        <HomeHero
          site={site}
          config={homeConfig.sections.hero}
          highlightedPost={homepagePosts.posts[0]}
          postSource={homepagePosts.source}
        />
      ) : null}

      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_70%_0%,rgba(112,123,255,0.07),transparent_31%),linear-gradient(180deg,#fbfbff_0%,#ffffff_74%)] dark:bg-[radial-gradient(circle_at_70%_0%,rgba(107,96,255,0.11),transparent_34%),linear-gradient(180deg,#171720_0%,#111116_74%)]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-36 top-20 size-80 rounded-full bg-[#e9eaff]/40 blur-3xl dark:bg-[#685fff]/10" />
          <div className="absolute -right-44 bottom-0 size-96 rounded-full bg-[#edf1ff]/55 blur-3xl dark:bg-[#5578ff]/10" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9">
          {homeConfig.sections.featuredPosts.enabled ? (
            <HomeFeaturedPosts
              posts={homepagePosts.posts}
              source={homepagePosts.source}
              config={homeConfig.sections.featuredPosts}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
