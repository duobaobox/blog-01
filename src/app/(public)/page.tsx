import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeHero } from "@/components/home/home-hero";
import { HomePostCard } from "@/components/home/home-post-card";
import { StaticPageContainer } from "@/components/blog/static-page-shell";
import { getHomepageFeaturedOrLatestPosts } from "@/features/posts/queries/post.queries";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import { getPublicCategories } from "@/features/taxonomy/queries/category.queries";
import { generateSeo } from "@/infrastructure/seo";

export const revalidate = 300;

export async function generateMetadata() {
  return generateSeo({ url: "/" });
}

export default async function HomePage() {
  const [site, homepagePosts, categories] = await Promise.all([
    getResolvedSiteConfig(),
    getHomepageFeaturedOrLatestPosts(3),
    getPublicCategories(),
  ]);
  const latestPosts = homepagePosts.posts;
  const showingFeaturedPosts = homepagePosts.source === "featured";

  return (
    <StaticPageContainer className="py-5 sm:py-8">
      <HomeHero
        siteName={site.name}
        subtitle={site.subtitle}
        description={site.description}
        avatar={site.avatar}
        categories={categories}
        postCount={latestPosts.length}
        showingFeaturedPosts={showingFeaturedPosts}
      />

      {latestPosts.length > 0 ? (
        <section className="py-16 sm:py-20" aria-labelledby="home-posts-title">
          <div className="mb-8 flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Curated writing
              </p>
              <h2
                id="home-posts-title"
                className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
              >
                {showingFeaturedPosts ? "精选文章" : "最近更新"}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                从最近的创作与思考中，挑几篇值得慢慢读的内容。
              </p>
            </div>

            <Link
              href="/blog"
              className="group hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              查看全部
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {latestPosts.map((post, index) => (
              <HomePostCard key={post.id} post={post} index={index} />
            ))}
          </div>

          <Link
            href="/blog"
            className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-primary sm:hidden"
          >
            查看全部文章
            <ArrowRight className="size-4" />
          </Link>
        </section>
      ) : (
        <div className="h-12 sm:h-16" />
      )}
    </StaticPageContainer>
  );
}
