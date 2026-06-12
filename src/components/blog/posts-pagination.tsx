"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";
import {
  buildPageHref,
  getPaginationPages,
} from "@/features/posts/lib/pagination";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";

interface PostsPaginationProps {
  pathname: string;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  className?: string;
}

export function PostsPagination({
  pathname,
  currentPage,
  totalPages,
  totalItems,
  className,
}: PostsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getPaginationPages(currentPage, totalPages);

  return (
    <nav
      aria-label="文章分页"
      className={cn(
        "flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        共 {totalItems} 篇文章，第 {currentPage} / {totalPages} 页
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildPageHref(pathname, currentPage - 1)}
          aria-disabled={currentPage <= 1}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            currentPage <= 1 && "pointer-events-none opacity-50",
          )}
        >
          <ChevronLeft className="size-3.5" />
          上一页
        </Link>

        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground"
            >
              <Ellipsis className="size-4" />
            </span>
          ) : (
            <Link
              key={page}
              href={buildPageHref(pathname, page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={buttonVariants({
                variant: page === currentPage ? "secondary" : "outline",
                size: "icon-sm",
              })}
            >
              {page}
            </Link>
          ),
        )}

        <Link
          href={buildPageHref(pathname, currentPage + 1)}
          aria-disabled={currentPage >= totalPages}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            currentPage >= totalPages && "pointer-events-none opacity-50",
          )}
        >
          下一页
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </nav>
  );
}
