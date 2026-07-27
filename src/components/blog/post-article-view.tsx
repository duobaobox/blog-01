import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, User } from "lucide-react";
import type { TocItem } from "@/features/editor/content-types";
import { TagBadge } from "@/features/taxonomy/components/tag-badge";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { formatDate } from "@/shared/lib/date";
import { TableOfContents } from "@/components/blog/table-of-contents";

export type PostArticleCategory = {
  id?: string;
  name: string;
  slug?: string | null;
};

export type PostArticleTag = {
  id: string;
  name: string;
  slug?: string | null;
  color: string | null;
};

export type PostArticleViewProps = {
  title: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  coverImageWidth?: number | null;
  coverImageHeight?: number | null;
  category?: PostArticleCategory | null;
  authorName: string;
  displayDate?: Date | string | number | null;
  readingTimeMinutes?: number | null;
  wordCount?: number | null;
  tags: PostArticleTag[];
  contentHtml: string;
  toc: TocItem[];
  contentRootId?: string;
};

export function PostArticleView({
  title,
  coverImageUrl,
  coverImageAlt,
  coverImageWidth,
  coverImageHeight,
  category,
  authorName,
  displayDate,
  readingTimeMinutes,
  wordCount,
  tags,
  contentHtml,
  toc,
  contentRootId,
}: PostArticleViewProps) {
  const categoryBadge = category ? (
    <Badge variant="secondary">{category.name}</Badge>
  ) : null;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_200px]">
      <article className="min-w-0">
        <header className="mb-8">
          {coverImageUrl ? (
            <div className="mb-6 overflow-hidden rounded-2xl border bg-muted/30">
              <Image
                src={coverImageUrl}
                alt={coverImageAlt || title}
                width={coverImageWidth ?? 1600}
                height={coverImageHeight ?? 900}
                sizes="(min-width: 1024px) 896px, 100vw"
                className="h-auto w-full object-cover"
              />
            </div>
          ) : null}

          {categoryBadge ? (
            <div className="mb-3 flex items-center gap-2">
              {category?.slug ? (
                <Link href={`/blog/categories/${category.slug}`}>
                  {categoryBadge}
                </Link>
              ) : (
                categoryBadge
              )}
            </div>
          ) : null}

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {authorName}
            </span>
            {displayDate ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(displayDate)}
              </span>
            ) : null}
            {readingTimeMinutes ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {readingTimeMinutes} 分钟
              </span>
            ) : null}
            {wordCount ? <span>{wordCount} 字</span> : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => {
              const badge = <TagBadge name={tag.name} color={tag.color} />;

              return tag.slug ? (
                <Link key={tag.id} href={`/blog/tags/${tag.slug}`}>
                  {badge}
                </Link>
              ) : (
                <span key={tag.id}>{badge}</span>
              );
            })}
          </div>
        </header>

        <Separator className="mb-8" />

        <div
          id={contentRootId}
          className="tiptap ProseMirror simple-editor readonly article-prose"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>

      {toc.length > 0 ? (
        <TableOfContents toc={toc} contentRootId={contentRootId} />
      ) : null}
    </div>
  );
}
