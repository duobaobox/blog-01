"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Tags,
  Settings,
  LogOut,
} from "lucide-react";
import { authClient } from "@/infrastructure/auth/client";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

const navItems = [
  { label: "概览", href: "/admin", icon: LayoutDashboard },
  { label: "文章", href: "/admin/posts", icon: FileText },
  { label: "分类", href: "/admin/categories", icon: FolderOpen },
  { label: "标签", href: "/admin/tags", icon: Tags },
  { label: "设置", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-muted/30">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="font-bold">
          后台管理
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          退出登录
        </Button>
        <Link
          href="/"
          className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          查看站点
        </Link>
      </div>
    </aside>
  );
}
