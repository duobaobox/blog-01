import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Calendar, Clock } from "lucide-react";
import type { PublicPostCard } from "@/features/posts/queries/post.queries";
import { getPostDisplayDate } from "@/features/posts/lib/post-status";
import { TagBadge } from "@/features/taxonomy/components/tag-badge";
import { formatDate } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";

type HomePostCardProps = {
  post: PublicPostCard;
  index: number;
};

const accents = [
  "from-violet-500/20 via-indigo-400/10 to-transparent",
  "from-amber-400/20 via-rose-300/10 to-transparent",
  "from-sky-400/20 via-cyan-300/10 to-transparent",
];

export function HomePostCard({ post, index }: HomePostCardProps) {
  const displayDate = getPostDisplayDate(post);
  const preview =
    post.excerpt?.trim() ||
    (post.contentText.trim()
      ? `${post.contentText.trim().slice(0, 108)}...`
      : "打开文章，继续阅读完整内容。");
  const coverImage = post.coverImage;
  const cardImage = coverImage?.variants?.card ?? coverImage;
  const coverImageUrl = coverImage?.url ?? post.coverImageUrl;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex min-h-full flex-col overflow-hidden rounded-[1.6rem] border bg-card shadow-[0_16px_45px_-30px_rgba(72,58,148,0.45)] transition duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_24px_55px_-28px_rgba(72,58,148,0.5)]"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-br",
          accents[index % accents.length],
        )}
      />

      {coverImageUrl ? (
        <div className="relative aspect-[16/10] overflow-hidden border-b bg-muted/30">
          <Image
            src={coverImageUrl}
            alt={coverImage?.alt ?? post.title}
            fill
            sizes="(min-width: 1280px) 320px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.035]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="relative flex aspect-[16/8] items-end overflow-hidden border-b px-6 pb-5">
          <span className="text-5xl font-black tracking-[-0.08em] text-primary/15">
            0{index + 1}
          </span>
        </div>
      )}

      <div className="relative flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-[0.72rem] text-muted-foreground">
          {post.isFeatured ? (
            <span className="rounded-full bg-primary/10 px-2 py-1 font-semibold text-primary">
              精选
            </span>
          ) : null}
          {post.category ? (
            <span className="font-semibold text-primary">
              {post.category.name}
            </span>
          ) : null}
          {displayDate ? (
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" aria-hidden="true" />
              {formatDate(displayDate)}
            </span>
          ) : null}
          {post.readingTimeMinutes ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" aria-hidden="true" />
              {post.readingTimeMinutes} 分钟
            </span>
          ) : null}
        </div>

        <h3 className="mt-4 text-xl font-bold leading-snug tracking-tight transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
          {preview}
        </p>

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 2).map((postTag) => (
              <TagBadge
                key={postTag.tag.id}
                name={postTag.tag.name}
                color={postTag.tag.color}
              />
            ))}
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-full border bg-background/80 text-muted-foreground transition group-hover:border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
