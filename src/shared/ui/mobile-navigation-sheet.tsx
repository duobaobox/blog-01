"use client";

import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import {
  isNavigationItemActive,
  type NavigationItem,
} from "@/shared/lib/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";

type MobileNavigationSheetProps = {
  pathname: string;
  nav: ReadonlyArray<NavigationItem>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * 移动端导航抽屉的**内容**部分，刻意不包含触发按钮。
 *
 * 触发按钮必须留在 header 里常驻渲染（否则首屏没有汉堡菜单），因此由外部按钮负责
 * 打开、这里只负责内容；base-ui 的对话框会把焦点还给它打开前聚焦的元素，也就是那个
 * 按钮，所以不需要 SheetTrigger 也不会丢焦点。
 *
 * 这样拆分是为了让 base-ui 的 dialog 运行时只在用户真正点开菜单时才被加载，
 * 而不是随每个公开页面下发。
 */
export function MobileNavigationSheet({
  pathname,
  nav,
  open,
  onOpenChange,
}: MobileNavigationSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[min(20rem,calc(100vw-1rem))] gap-0 px-0"
      >
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>导航菜单</SheetTitle>
          <SheetDescription>快速跳转到站点的主要页面。</SheetDescription>
        </SheetHeader>
        <nav
          aria-label="移动端主要导航"
          className="flex flex-col gap-2 px-4 py-4"
        >
          {nav.map((item) => {
            const isActive = isNavigationItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                  isActive ? "bg-accent text-foreground" : "text-foreground/60",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
