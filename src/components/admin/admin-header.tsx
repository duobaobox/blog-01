"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb";
import { SidebarTrigger } from "@/shared/ui/sidebar";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

const routeLabels: Record<string, string> = {
  "/admin": "概览",
  "/admin/posts": "文章管理",
  "/admin/posts/new": "新建文章",
  "/admin/categories": "分类管理",
  "/admin/tags": "标签管理",
  "/admin/settings": "站点设置",
};

function getPageLabel(pathname: string): string {
  if (routeLabels[pathname]) return routeLabels[pathname];
  // 处理 /admin/posts/[id] 这类动态路由
  if (pathname.match(/^\/admin\/posts\/[^/]+$/)) return "编辑文章";
  return "后台管理";
}

function isSubPage(pathname: string): boolean {
  return pathname !== "/admin" && pathname.startsWith("/admin/");
}

export function AdminHeader() {
  const pathname = usePathname();
  const pageLabel = getPageLabel(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Breadcrumb>
        <BreadcrumbList>
          {isSubPage(pathname) ? (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link href="/admin" />}>
                  后台管理
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem>
              <BreadcrumbPage>概览</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
