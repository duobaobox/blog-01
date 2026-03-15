"use client";

import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { TagBadge } from "@/features/taxonomy/components/tag-badge";
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
    contentMarkdown: string;
    publishedAt: Date | null;
    createdAt: Date;
    readingTimeMinutes: number | null;
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
  return (
    <Link href={`/blog/${post.slug}`} className="block">
      <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
                ? new Date(post.publishedAt).toLocaleDateString("zh-CN")
                : new Date(post.createdAt).toLocaleDateString("zh-CN")}
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
            {post.excerpt ?? `${post.contentMarkdown.slice(0, 120)}...`}
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
