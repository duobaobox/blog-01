"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetDescription,
  SheetTrigger,
  SheetTitle,
} from "@/shared/ui/sheet";
import { cn } from "@/shared/lib/utils";

interface HeaderProps {
  siteName: string;
  logoUrl?: string;
  nav: ReadonlyArray<{
    label: string;
    href: string;
  }>;
}

export function Header({ siteName, logoUrl, nav }: HeaderProps) {
  const pathname = usePathname();
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const navigationOpen = openPathname === pathname;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 min-w-0 max-w-5xl items-center px-4 sm:px-6">
        <Link href="/" className="mr-4 flex min-w-0 items-center gap-3 font-bold sm:mr-6">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={siteName}
              width={32}
              height={32}
              sizes="32px"
              className="size-8 rounded-lg border object-cover"
            />
          ) : null}
          <span className="truncate">{siteName}</span>
        </Link>

        {/* 桌面端导航 */}
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground/80",
                isActive(item.href) ? "text-foreground" : "text-foreground/60",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1">
          <ThemeToggle />

          {/* 移动端菜单 */}
          <Sheet
            open={navigationOpen}
            onOpenChange={(open) => setOpenPathname(open ? pathname : null)}
          >
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden" />
              }
            >
              <Menu />
              <span className="sr-only">菜单</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(20rem,calc(100vw-1rem))] gap-0 px-0">
              <SheetHeader className="border-b px-4 py-3">
                <SheetTitle>导航菜单</SheetTitle>
                <SheetDescription>快速跳转到站点的主要页面。</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-2 px-4 py-4">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpenPathname(null)}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                      isActive(item.href)
                        ? "bg-accent text-foreground"
                        : "text-foreground/60",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
