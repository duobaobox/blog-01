import type { ReactNode } from "react";
import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib/utils";

// 最底层的静态页面容器。
// 后续如果你复制页面文件，只想复用统一宽度和留白，但标题区想自己写，就直接用这个组件包住页面内容。
type StaticPageContainerProps = {
  className?: string;
  children: ReactNode;
};

export function StaticPageContainer({
  className,
  children,
}: StaticPageContainerProps) {
  return (
    <div className={cn("mx-auto max-w-5xl px-4 py-16 sm:px-6", className)}>
      {children}
    </div>
  );
}

type StaticPageShellProps = {
  title: string;
  description?: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
};

// 标准静态页骨架。
// 适合 about、projects、uses 这类页面：
// 1. 改 title / description
// 2. 主要内容直接写在 children 里
// 3. 如果只是调内容区排版，改 contentClassName
export function StaticPageShell({
  title,
  description,
  className,
  contentClassName,
  children,
}: StaticPageShellProps) {
  return (
    <StaticPageContainer className={className}>
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-2 text-muted-foreground">{description}</p>
        ) : null}
      </header>

      <Separator className="my-6" />

      <div className={contentClassName}>{children}</div>
    </StaticPageContainer>
  );
}

type StaticPageSectionProps = {
  title: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
};

// 常规内容分段组件。
// 复制静态页时，最常见的写法就是一段一段地用这个组件包住正文内容。
export function StaticPageSection({
  title,
  className,
  contentClassName,
  children,
}: StaticPageSectionProps) {
  return (
    <section className={className}>
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className={cn("mt-2", contentClassName)}>{children}</div>
    </section>
  );
}
