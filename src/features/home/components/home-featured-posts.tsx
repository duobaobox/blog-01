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
      "from-site-accent/10 via-site-accent/5 to-white dark:from-site-accent/15 dark:via-site-accent/8 dark:to-slate-950",
    halo: "bg-site-accent/20 dark:bg-site-accent/[0.14]",
    icon: "from-site-accent to-site-accent-hover shadow-site-accent/[0.22]",
  },
  {
    surface:
      "from-[#fff2e4] via-[#fff8f0] to-white dark:from-orange-950/55 dark:via-amber-950/32 dark:to-slate-950",
    halo: "bg-[#ffad67]/20 dark:bg-orange-500/[0.14]",
    icon: "from-[#ff9b49] to-[#f07835] shadow-[#ff9b49]/[0.22]",
  },
  {
    surface:
      "from-[#ebf8f1] via-[#f7fcf9] to-white dark:from-emerald-950/55 dark:via-green-950/32 dark:to-slate-950",
    halo: "bg-[#6ed69a]/20 dark:bg-emerald-500/[0.14]",
    icon: "from-[#48c982] to-[#2bae68] shadow-[#48c982]/[0.22]",
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
      className="group flex min-w-0 flex-col overflow-hidden rounded-[1.15rem] border border-[#ebe8f4] bg-white/[0.94] shadow-[0_14px_36px_-30px_rgba(82,75,155,0.34)] transition duration-300 hover:-translate-y-1 hover:border-site-accent/25 hover:shadow-[0_22px_44px_-29px_rgba(82,75,155,0.34)] dark:border-white/10 dark:bg-white/[0.055]"
    >
      <div
        className={`relative aspect-[16/9] overflow-hidden border-b border-[#eeeaf7] bg-linear-to-br ${placeholder.surface} dark:border-white/10`}
      >
        {coverImageUrl ? (
          <>
            <Image
              src={coverImageUrl}
              alt={post.coverImage?.alt ?? post.title}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 300px, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/10 via-transparent to-white/5" />
          </>
        ) : (
          <>
            <div
              className={`absolute left-[16%] top-[12%] size-28 rounded-full blur-2xl ${placeholder.halo}`}
            />
            <div className="absolute -right-8 -top-10 size-32 rounded-full border border-white/60 bg-white/30 dark:border-white/10 dark:bg-white/5" />
            <div className="absolute -bottom-14 -left-8 size-36 rounded-full border border-white/75 bg-white/[0.48] dark:border-white/10 dark:bg-white/5" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`flex size-16 -rotate-6 items-center justify-center rounded-[1.05rem] bg-linear-to-br text-white shadow-xl transition duration-300 group-hover:rotate-0 group-hover:scale-105 ${placeholder.icon}`}
              >
                <BookOpenText className="size-8" />
              </div>
            </div>
          </>
        )}

        <span className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full border border-white/75 bg-white/[0.78] text-site-accent shadow-sm backdrop-blur transition duration-300 group-hover:rotate-6 group-hover:bg-white dark:border-white/15 dark:bg-slate-950/55">
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-[1.1rem]">
        <div className="mb-3 flex min-h-6 flex-wrap items-center gap-2">
          {firstTag ? (
            <TagBadge name={firstTag.name} color={firstTag.color} />
          ) : post.category ? (
            <span className="rounded-full bg-site-accent-soft px-2.5 py-1 text-xs font-medium text-site-accent">
              {post.category.name}
            </span>
          ) : (
            <span className="rounded-full bg-[#f7f7fa] px-2.5 py-1 text-xs text-[#8b91a2] dark:bg-white/5 dark:text-slate-300/70">
              博客文章
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-[#252a3e] transition-colors group-hover:text-site-accent sm:text-lg dark:text-white dark:group-hover:text-site-accent">
          {post.title}
        </h3>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-xs text-[#9aa0b0] dark:text-slate-400">
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
      <div className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-site-accent-soft blur-3xl dark:bg-site-accent/10" />
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
