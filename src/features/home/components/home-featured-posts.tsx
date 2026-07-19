import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Calendar, Clock } from "lucide-react";
import type { PublicPostCard } from "@/features/posts/queries/post.queries";
import { getPostDisplayDate } from "@/features/posts/lib/post-status";
import { TagBadge } from "@/features/taxonomy/components/tag-badge";
import type { HomeFeaturedPostsConfig } from "@/features/home/config/home.config";
import { HomeSectionShell } from "@/features/home/components/home-section-shell";
import { formatDate } from "@/shared/lib/date";

type HomeFeaturedPostsProps = {
  posts: PublicPostCard[];
  source: "featured" | "latest";
  config: HomeFeaturedPostsConfig;
};

function HomePostCard({ post, priority }: { post: PublicPostCard; priority: boolean }) {
  const displayDate = getPostDisplayDate(post);
  const coverImage = post.coverImage?.variants?.card ?? post.coverImage;
  const coverImageUrl = coverImage?.url ?? post.coverImageUrl;
  const firstTag = post.tags[0]?.tag;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-background/75 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/15 via-background to-muted">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={post.coverImage?.alt ?? post.title}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
          />
        ) : (
          <>
            <div className="absolute -right-8 -top-8 size-28 rounded-full border border-primary/15 bg-primary/10" />
            <div className="absolute -bottom-10 -left-8 size-32 rounded-full border border-primary/10 bg-background/70" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-16 rotate-[-6deg] items-center justify-center rounded-2xl border border-primary/15 bg-background/80 text-primary shadow-lg backdrop-blur transition-transform duration-300 group-hover:rotate-0 group-hover:scale-105">
                <BookOpen className="size-8" />
              </div>
            </div>
          </>
        )}

        <span className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full border border-white/30 bg-background/75 text-foreground shadow-sm backdrop-blur transition-transform group-hover:rotate-6">
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex min-h-6 flex-wrap items-center gap-2">
          {firstTag ? (
            <TagBadge name={firstTag.name} color={firstTag.color} />
          ) : post.category ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {post.category.name}
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              博客文章
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
          {post.title}
        </h3>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5 text-xs text-muted-foreground">
          {post.readingTimeMinutes ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {post.readingTimeMinutes} 分钟阅读
            </span>
          ) : null}
          {post.readingTimeMinutes && displayDate ? <span>·</span> : null}
          {displayDate ? (
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" />
              {formatDate(displayDate)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function HomeFeaturedPosts({
  posts,
  source,
  config,
}: HomeFeaturedPostsProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <HomeSectionShell
      title={source === "featured" ? config.featuredTitle : config.latestTitle}
      description={config.description}
      action={config.action}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <HomePostCard key={post.id} post={post} priority={index === 0} />
        ))}
      </div>
    </HomeSectionShell>
  );
}
