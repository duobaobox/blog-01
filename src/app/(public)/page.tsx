import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { PostListCard } from "@/features/posts/components/post-list-card";
import { getPosts } from "@/features/posts/queries/post.queries";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import { generateSeo } from "@/infrastructure/seo";

export async function generateMetadata() {
  return generateSeo({ url: "/" });
}

export default async function HomePage() {
  const site = await getResolvedSiteConfig();
  const featuredPosts = await getPosts({
    status: "published",
    isFeatured: true,
    order: "published",
    take: 3,
  });
  const latestPosts =
    featuredPosts.length > 0
      ? featuredPosts
      : await getPosts({
          status: "published",
          order: "published",
          take: 3,
        });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <section className="grid gap-10 py-20 sm:grid-cols-[1fr_180px] sm:items-center sm:py-28">
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            你好，我是 <span className="text-primary">{site.name}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            {site.subtitle || site.description}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            这里会同步展示后台设定的站点信息，以及我最近发布或置顶的内容。
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              阅读博客 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              关于我
            </Link>
          </div>
        </div>

        <div className="flex justify-start sm:justify-end">
          {site.avatarUrl ? (
            <Image
              src={site.avatarUrl}
              alt={site.name}
              width={160}
              height={160}
              unoptimized
              className="h-32 w-32 rounded-3xl border object-cover shadow-sm sm:h-40 sm:w-40"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-3xl border bg-muted text-4xl font-semibold text-primary shadow-sm sm:h-40 sm:w-40">
              {site.name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      </section>

      {latestPosts.length > 0 ? (
        <section className="pb-20">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {featuredPosts.length > 0 ? "精选文章" : "最新文章"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                后台置顶和已发布的内容会优先出现在这里。
              </p>
            </div>
            <Link
              href="/blog"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              查看全部
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {latestPosts.map((post) => (
              <PostListCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
