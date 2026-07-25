"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock } from "lucide-react";
import type { MediaPresentation } from "@/features/media/queries/media.queries";
import { getPostDisplayDate } from "@/features/posts/lib/post-status";
import { TagBadge } from "@/features/taxonomy/components/tag-badge";
import { formatDate } from "@/shared/lib/date";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { cardMotifs, getMotifIndex } from "@/features/posts/components/card-motifs";

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
  /** 可选：由父组件统一分配图腾索引，保证相邻卡片不同；不传则基于 slug 哈希 */
  motifIndex?: number;
};

export function PostListCard({ post, showCategory = true, motifIndex }: PostListCardProps) {
  const preview = post.excerpt ?? `${post.contentText.slice(0, 120)}...`;
  const displayDate = getPostDisplayDate(post);
  const coverImage = post.coverImage;
  const cardImage = coverImage?.variants?.card ?? coverImage;
  const coverImageUrl = coverImage?.url ?? post.coverImageUrl;

  const motifIdx = motifIndex ?? getMotifIndex(post.slug);
  const MotifComponent = cardMotifs[motifIdx];

  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <Card className="relative gap-0 py-0 transition-all duration-200 hover:border-primary/20 hover:shadow-md">
        {coverImageUrl ? (
          <div className="overflow-hidden rounded-t-xl border-b bg-muted/30">
            <Image
              src={coverImageUrl}
              alt={coverImage?.alt ?? post.title}
              width={cardImage?.width ?? 1200}
              height={cardImage?.height ?? 630}
              sizes="(min-width: 1280px) 352px, (min-width: 768px) 50vw, 100vw"
              className="h-52 w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
        ) : null}
        <CardHeader className="space-y-3 py-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {post.isFeatured ? (
              <>
                <span className="font-medium text-primary">精选</span>
                <span>·</span>
              </>
            ) : null}
            {showCategory && post.category && (
              <>
                <span className="font-medium text-primary">
                  {post.category.name}
                </span>
                <span>·</span>
              </>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {displayDate ? formatDate(displayDate) : ""}
            </span>
            {post.readingTimeMinutes && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readingTimeMinutes} 分钟
                </span>
              </>
            )}
          </div>
          <CardTitle className="text-xl leading-tight">{post.title}</CardTitle>
          <CardDescription className="line-clamp-2 text-sm leading-relaxed">
            {preview}
          </CardDescription>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {post.tags.map((pt) => (
                <TagBadge
                  key={pt.tag.id}
                  name={pt.tag.name}
                  color={pt.tag.color}
                />
              ))}
            </div>
          )}
        </CardHeader>

        {/* 右下角 SVG 几何图腾（8 种随机） */}
        <div
          className="pointer-events-none absolute right-0 bottom-0 h-36 w-48 overflow-hidden rounded-br-xl select-none"
          aria-hidden="true"
          style={{
            maskImage:
              "linear-gradient(to top left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.72) 36%, rgba(0,0,0,0) 80%)",
            WebkitMaskImage:
              "linear-gradient(to top left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.72) 36%, rgba(0,0,0,0) 80%)",
          }}
        >
          <MotifComponent className="absolute right-0 bottom-0 h-full w-full text-primary/12 transition-all duration-500 ease-out group-hover:scale-[1.04] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </Card>
    </Link>
  );
}
