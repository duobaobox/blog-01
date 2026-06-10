"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { TocItem } from "@/features/editor/content-types";
import { cn } from "@/shared/lib/utils";

interface TableOfContentsProps {
  toc: TocItem[];
}

export function TableOfContents({ toc }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window === "undefined") return "";

    const hash = window.location.hash.slice(1);
    return toc.some((item) => item.id === hash) ? hash : "";
  });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const headingElementsRef = useRef<Map<string, IntersectionObserverEntry>>(
    new Map()
  );

  // 根据可见标题确定当前激活的目录项
  const getActiveHeading = useCallback(() => {
    const headingElements = headingElementsRef.current;
    const tocIds = toc.map((item) => item.id);

    // 找出所有正在相交（可见）的标题
    const visibleHeadings: string[] = [];
    headingElements.forEach((entry, id) => {
      if (entry.isIntersecting && tocIds.includes(id)) {
        visibleHeadings.push(id);
      }
    });

    // 如果有可见的标题，选择在文档中出现最早的那个
    if (visibleHeadings.length > 0) {
      const sorted = visibleHeadings.sort((a, b) => {
        return tocIds.indexOf(a) - tocIds.indexOf(b);
      });
      return sorted[0];
    }

    return null;
  }, [toc]);

  useEffect(() => {
    // 清理旧的 observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const callback: IntersectionObserverCallback = (entries) => {
      // 更新所有标题的状态
      entries.forEach((entry) => {
        headingElementsRef.current.set(entry.target.id, entry);
      });

      const activeHeading = getActiveHeading();
      if (activeHeading) {
        setActiveId(activeHeading);
      }
    };

    // rootMargin: 顶部 -80px（给固定导航栏留空间），底部 -60% 让标题在上半部分时就触发
    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: "-80px 0px -60% 0px",
      threshold: 0,
    });

    // 观察所有目录中的标题元素
    const tocIds = toc.map((item) => item.id);
    tocIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [toc, getActiveHeading]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      // 更新 URL hash（不触发跳转）
      window.history.replaceState(null, "", `#${id}`);
      setActiveId(id);
    }
  };

  return (
    <aside className="hidden lg:block sticky top-20">
      <div>
        <h3 className="mb-3 text-sm font-semibold">目录</h3>
        <nav className="relative flex max-h-[calc(100dvh-8rem)] flex-col gap-0.5 overflow-y-auto">
          {toc.map((item) => {
            const isActive = activeId === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={cn(
                  "relative block border-l-2 py-1 text-sm transition-all duration-200",
                  item.level === 3 ? "pl-6" : "pl-3",
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
