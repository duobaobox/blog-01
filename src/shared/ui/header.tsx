"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { MediaPresentation } from "@/features/media/queries/media.queries";
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
  logo?: MediaPresentation;
  nav: ReadonlyArray<{
    label: string;
    href: string;
  }>;
}

export function Header({ siteName, logo, nav }: HeaderProps) {
  const pathname = usePathname();
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigationOpen = openPathname === pathname;

  useEffect(() => {
    let frame = 0;

    function handleScroll() {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 16);
        frame = 0;
      });
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header
      className={cn(
        "public-header sticky top-0 z-50 h-14 w-full",
        isScrolled && "public-header--scrolled",
      )}
    >
      <div className="public-header__shell mx-auto h-full max-w-5xl px-4 sm:px-6">
        <div className="public-header__inner mx-auto grid h-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-6">
          <Link
            href="/"
            className="public-brand min-w-0 justify-self-start"
            aria-label={"回到 " + siteName + " 首页"}
          >
            <span className="public-brand__mark" aria-hidden="true">
              {logo ? (
                <Image
                  src={logo.url}
                  alt=""
                  width={logo.width ?? 32}
                  height={logo.height ?? 32}
                  sizes="32px"
                  className="size-full rounded-[10px] object-cover"
                />
              ) : (
                <span className="public-brand__spark" />
              )}
            </span>
            <span className="public-brand__copy min-w-0">
              <span className="public-brand__title">{siteName}</span>
            </span>
          </Link>

          <nav
            aria-label="主要导航"
            className="hidden items-center justify-center gap-1 md:flex"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "public-nav-link rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex min-w-0 items-center justify-self-end gap-1">
            <ThemeToggle />

            <Sheet
              open={navigationOpen}
              onOpenChange={(open) =>
                setOpenPathname(open ? pathname : null)
              }
            >
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="public-menu-button md:hidden"
                  />
                }
              >
                <Menu />
                <span className="sr-only">菜单</span>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[min(20rem,calc(100vw-1rem))] gap-0 px-0"
              >
                <SheetHeader className="border-b px-4 py-3">
                  <SheetTitle>导航菜单</SheetTitle>
                  <SheetDescription>
                    快速跳转到站点的主要页面。
                  </SheetDescription>
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
      </div>
    </header>
  );
}
