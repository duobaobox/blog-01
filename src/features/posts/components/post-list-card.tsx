"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock } from "lucide-react";
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
};

export function PostListCard({ post, showCategory = true }: PostListCardProps) {
  const preview = post.excerpt ?? `${post.contentText.slice(0, 120)}...`;

  return (
    <Link href={`/blog/${post.slug}`} className="block">
      <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20">
        {post.coverImageUrl ? (
          <div className="overflow-hidden rounded-t-xl border-b bg-muted/30">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              width={1200}
              height={630}
              sizes="(min-width: 1280px) 352px, (min-width: 768px) 50vw, 100vw"
              className="h-52 w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
        ) : null}
        <CardHeader className="space-y-3">
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
              {post.publishedAt
                ? formatDate(post.publishedAt)
                : formatDate(post.createdAt)}
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
          <CardDescription className="text-sm leading-relaxed line-clamp-2">
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
      </Card>
    </Link>
  );
}
