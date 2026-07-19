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

      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_72%_0%,rgba(124,92,255,0.09),transparent_32%),linear-gradient(180deg,#fbfaff_0%,#ffffff_72%)] dark:bg-[radial-gradient(circle_at_72%_0%,rgba(124,92,255,0.12),transparent_34%),linear-gradient(180deg,#171520_0%,#111116_72%)]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-36 top-20 size-80 rounded-full bg-violet-100/40 blur-3xl dark:bg-violet-700/10" />
          <div className="absolute -right-44 bottom-0 size-96 rounded-full bg-indigo-100/45 blur-3xl dark:bg-indigo-700/10" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9 lg:px-10 xl:px-12">
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
