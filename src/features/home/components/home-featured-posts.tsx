import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpenText, Calendar, Clock } from "lucide-react";
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

const placeholderStyles = [
  {
    surface:
      "from-violet-100 via-indigo-50 to-white dark:from-violet-950/70 dark:via-indigo-950/45 dark:to-slate-950",
    halo: "bg-violet-400/25 dark:bg-violet-500/15",
    icon: "from-violet-500 to-indigo-600 shadow-violet-500/25",
  },
  {
    surface:
      "from-orange-100 via-amber-50 to-white dark:from-orange-950/60 dark:via-amber-950/35 dark:to-slate-950",
    halo: "bg-orange-400/25 dark:bg-orange-500/15",
    icon: "from-orange-400 to-orange-600 shadow-orange-500/25",
  },
  {
    surface:
      "from-emerald-100 via-green-50 to-white dark:from-emerald-950/60 dark:via-green-950/35 dark:to-slate-950",
    halo: "bg-emerald-400/25 dark:bg-emerald-500/15",
    icon: "from-emerald-400 to-green-600 shadow-emerald-500/25",
  },
] as const;

function HomePostCard({
  post,
  priority,
  index,
}: {
  post: PublicPostCard;
  priority: boolean;
  index: number;
}) {
  const displayDate = getPostDisplayDate(post);
  const coverImage = post.coverImage?.variants?.card ?? post.coverImage;
  const coverImageUrl = coverImage?.url ?? post.coverImageUrl;
  const firstTag = post.tags[0]?.tag;
  const placeholder = placeholderStyles[index % placeholderStyles.length];

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-[1.15rem] border border-violet-100/90 bg-white/90 shadow-[0_16px_40px_-32px_rgba(76,56,180,0.48)] transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_24px_48px_-30px_rgba(76,56,180,0.42)] dark:border-white/10 dark:bg-white/[0.055]"
    >
      <div
        className={`relative aspect-[16/9] overflow-hidden border-b border-violet-100/70 bg-linear-to-br ${placeholder.surface} dark:border-white/10`}
      >
        {coverImageUrl ? (
          <>
            <Image
              src={coverImageUrl}
              alt={post.coverImage?.alt ?? post.title}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 370px, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/10 via-transparent to-white/5" />
          </>
        ) : (
          <>
            <div
              className={`absolute left-[16%] top-[12%] size-28 rounded-full blur-2xl ${placeholder.halo}`}
            />
            <div className="absolute -right-8 -top-10 size-32 rounded-full border border-white/55 bg-white/25 dark:border-white/10 dark:bg-white/5" />
            <div className="absolute -bottom-14 -left-8 size-36 rounded-full border border-white/70 bg-white/45 dark:border-white/10 dark:bg-white/5" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`flex size-16 -rotate-6 items-center justify-center rounded-[1.1rem] bg-linear-to-br text-white shadow-xl transition duration-300 group-hover:rotate-0 group-hover:scale-105 ${placeholder.icon}`}
              >
                <BookOpenText className="size-8" />
              </div>
            </div>
          </>
        )}

        <span className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full border border-white/70 bg-white/75 text-violet-600 shadow-sm backdrop-blur transition duration-300 group-hover:rotate-6 group-hover:bg-white dark:border-white/15 dark:bg-slate-950/55 dark:text-violet-300">
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-[1.1rem]">
        <div className="mb-3 flex min-h-6 flex-wrap items-center gap-2">
          {firstTag ? (
            <TagBadge name={firstTag.name} color={firstTag.color} />
          ) : post.category ? (
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
              {post.category.name}
            </span>
          ) : (
            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-300/70">
              博客文章
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-slate-900 transition-colors group-hover:text-violet-700 sm:text-lg dark:text-white dark:group-hover:text-violet-300">
          {post.title}
        </h3>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-xs text-slate-400 dark:text-slate-400">
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
      className="relative overflow-hidden"
    >
      <div className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-violet-200/25 blur-3xl dark:bg-violet-600/10" />
      <div className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <HomePostCard
            key={post.id}
            post={post}
            index={index}
            priority={index === 0}
          />
        ))}
      </div>
    </HomeSectionShell>
  );
}
