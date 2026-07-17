"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TocItem } from "@/features/editor/content-types";
import { cn } from "@/shared/lib/utils";

interface TableOfContentsProps {
  toc: TocItem[];
  contentRootId?: string;
}

function findHeadingElement(id: string, contentRootId?: string) {
  if (!contentRootId) {
    return document.getElementById(id);
  }

  const contentRoot = document.getElementById(contentRootId);
  if (!contentRoot) {
    return null;
  }

  return (
    Array.from(contentRoot.querySelectorAll<HTMLElement>("[id]")).find(
      (element) => element.id === id,
    ) ?? null
  );
}

function getTocIndentClass(level: number) {
  if (level <= 1) return "pl-3";
  if (level === 2) return "pl-5";
  if (level === 3) return "pl-7";
  return "pl-9";
}

export function TableOfContents({
  toc,
  contentRootId,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window === "undefined" || contentRootId) return "";

    const hash = window.location.hash.slice(1);
    return toc.some((item) => item.id === hash) ? hash : "";
  });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const headingElementsRef = useRef<Map<string, IntersectionObserverEntry>>(
    new Map(),
  );

  const getActiveHeading = useCallback(() => {
    const headingElements = headingElementsRef.current;
    const tocIds = toc.map((item) => item.id);
    const visibleHeadings: string[] = [];

    headingElements.forEach((entry, id) => {
      if (entry.isIntersecting && tocIds.includes(id)) {
        visibleHeadings.push(id);
      }
    });

    if (visibleHeadings.length > 0) {
      return visibleHeadings.sort(
        (a, b) => tocIds.indexOf(a) - tocIds.indexOf(b),
      )[0];
    }

    return null;
  }, [toc]);

  useEffect(() => {
    observerRef.current?.disconnect();
    headingElementsRef.current.clear();

    const callback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        headingElementsRef.current.set(entry.target.id, entry);
      });

      const activeHeading = getActiveHeading();
      if (activeHeading) {
        setActiveId(activeHeading);
      }
    };

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: "-80px 0px -60% 0px",
      threshold: 0,
    });

    toc.forEach((item) => {
      const element = findHeadingElement(item.id, contentRootId);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
      headingElementsRef.current.clear();
    };
  }, [toc, contentRootId, getActiveHeading]);

  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    event.preventDefault();
    const element = findHeadingElement(id, contentRootId);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      if (!contentRootId) {
        window.history.replaceState(null, "", `#${id}`);
      }
      setActiveId(id);
    }
  };

  return (
    <aside className="sticky top-20 hidden lg:block">
      <div>
        <h3 className="mb-3 text-sm font-semibold">目录</h3>
        <nav className="relative flex max-h-[calc(100dvh-8rem)] flex-col gap-0.5 overflow-y-auto">
          {toc.map((item) => {
            const isActive = activeId === item.id;

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(event) => handleClick(event, item.id)}
                className={cn(
                  "relative block border-l-2 py-1 text-sm transition-all duration-200",
                  getTocIndentClass(item.level),
                  item.level === 1 && "font-medium",
                  isActive
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground",
                )}
              >
                {item.title}
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
