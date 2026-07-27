import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import type { MediaPresentation } from "@/features/media/queries/media.queries";
import { cardMotifs } from "@/features/posts/components/card-motifs";
import { getPostDisplayDate } from "@/features/posts/lib/post-status";
import { resolveMotifIndex } from "@/features/posts/lib/card-motif-assignment";
import { TagBadge } from "@/features/taxonomy/components/tag-badge";
import { formatDate } from "@/shared/lib/date";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

type PostListCardProps = {
  post: {
    slug: string;
    title: string;
    excerpt: string | null;
    contentText: string;
    coverImageUrl: string | null;
    coverImage?: MediaPresentation;
    publishedAt: Date | null;
    createdAt: Date;
    readingTimeMinutes: number | null;
    isFeatured: boolean;
    category: {
      name: string;
    } | null;
    tags: Array<{
      tag: {
        id: string;
        name: string;
        color: string | null;
      };
    }>;
  };
  showCategory?: boolean;
  motifIndex?: number;
};

function getPostPreview(excerpt: string | null, contentText: string) {
  if (excerpt?.trim()) {
    return excerpt.trim();
  }

  const preview = contentText.trim().slice(0, 120);
  return preview ? `${preview}${contentText.trim().length > 120 ? "..." : ""}` : "";
}

export function PostListCard({
  post,
  showCategory = true,
  motifIndex,
}: PostListCardProps) {
  const preview = getPostPreview(post.excerpt, post.contentText);
  const displayDate = getPostDisplayDate(post);
  const coverImage = post.coverImage;
  const cardImage = coverImage?.variants?.card ?? coverImage;
  const coverImageUrl = coverImage?.url ?? post.coverImageUrl;
  const MotifComponent = cardMotifs[resolveMotifIndex(motifIndex, post.slug)];

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <Card className="relative gap-0 py-0 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-site-accent/20 hover:shadow-md">
        {coverImageUrl ? (
          <div className="overflow-hidden rounded-t-xl border-b bg-muted/30">
            <Image
              src={coverImageUrl}
              alt={coverImage?.alt ?? post.title}
              width={cardImage?.width ?? 1200}
              height={cardImage?.height ?? 630}
              sizes="(min-width: 1280px) 352px, (min-width: 768px) 50vw, 100vw"
              className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        ) : null}

        <CardHeader className="relative z-10 space-y-3 py-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {post.isFeatured ? (
              <>
                <span className="font-medium text-site-accent">精选</span>
                <span aria-hidden="true">·</span>
              </>
            ) : null}
            {showCategory && post.category ? (
              <>
                <span className="font-medium text-site-accent">
                  {post.category.name}
                </span>
                <span aria-hidden="true">·</span>
              </>
            ) : null}
            {displayDate ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3" aria-hidden="true" />
                {formatDate(displayDate)}
              </span>
            ) : null}
            {post.readingTimeMinutes ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" aria-hidden="true" />
                  {post.readingTimeMinutes} 分钟
                </span>
              </>
            ) : null}
          </div>

          <CardTitle className="text-xl leading-tight transition-colors group-hover:text-site-accent">
            {post.title}
          </CardTitle>
          {preview ? (
            <CardDescription className="line-clamp-2 text-sm leading-relaxed">
              {preview}
            </CardDescription>
          ) : null}
          {post.tags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {post.tags.map((item) => (
                <TagBadge
                  key={item.tag.id}
                  name={item.tag.name}
                  color={item.tag.color}
                />
              ))}
            </div>
          ) : null}
        </CardHeader>

        <div
          className="pointer-events-none absolute bottom-0 right-0 h-36 w-48 select-none overflow-hidden rounded-br-xl"
          aria-hidden="true"
          style={{
            maskImage:
              "linear-gradient(to top left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.72) 36%, rgba(0,0,0,0) 80%)",
            WebkitMaskImage:
              "linear-gradient(to top left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.72) 36%, rgba(0,0,0,0) 80%)",
          }}
        >
          <MotifComponent
            strokeWidth={0.95}
            className="absolute bottom-0 right-0 h-full w-full text-site-accent/[0.16] transition-transform duration-500 ease-out group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-[1.04]"
          />
        </div>
      </Card>
    </Link>
  );
}
