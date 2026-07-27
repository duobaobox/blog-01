"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import type { MediaPresentation } from "@/features/media/queries/media.queries";
import { useNavigationGlass } from "@/shared/hooks/use-navigation-glass";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
import { NavigationGlassDefs } from "@/shared/ui/navigation-glass-defs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

const MOBILE_NAVIGATION_TRIGGER_ID = "public-mobile-navigation-trigger";

type NavigationItem = {
  label: string;
  href: string;
};

interface HeaderProps {
  siteName: string;
  logo?: MediaPresentation;
  nav: ReadonlyArray<NavigationItem>;
}

function isNavigationItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function DesktopNavigation({
  pathname,
  nav,
}: {
  pathname: string;
  nav: ReadonlyArray<NavigationItem>;
}) {
  return (
    <nav
      aria-label="主要导航"
      className="hidden items-center justify-center gap-1 md:flex"
    >
      {nav.map((item) => {
        const isActive = isNavigationItemActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "public-nav-link rounded-full px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNavigation({
  pathname,
  nav,
  open,
  onOpenChange,
}: {
  pathname: string;
  nav: ReadonlyArray<NavigationItem>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      triggerId={open ? MOBILE_NAVIGATION_TRIGGER_ID : null}
    >
      <SheetTrigger
        id={MOBILE_NAVIGATION_TRIGGER_ID}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "public-menu-button md:hidden",
        )}
      >
        <Menu aria-hidden="true" />
        <span className="sr-only">菜单</span>
      </SheetTrigger>
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

export function Header({ siteName, logo, nav }: HeaderProps) {
  const pathname = usePathname();
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const { shellRef, glassMapRef, isScrolled } = useNavigationGlass();
  const navigationOpen = openPathname === pathname;

  return (
    <header
      className={cn(
        "public-header sticky top-0 z-50 h-14 w-full",
        isScrolled && "public-header--scrolled",
      )}
    >
      <div
        ref={shellRef}
        className="public-header__shell mx-auto h-full max-w-5xl px-4 sm:px-6"
      >
        <div className="public-header__inner mx-auto grid h-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-6">
          <Link
            href="/"
            className="public-brand min-w-0 justify-self-start"
            aria-label={`回到 ${siteName} 首页`}
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

          <DesktopNavigation pathname={pathname} nav={nav} />

          <div className="flex min-w-0 items-center justify-self-end gap-1">
            <ThemeToggle />
            <MobileNavigation
              pathname={pathname}
              nav={nav}
              open={navigationOpen}
              onOpenChange={(open) => setOpenPathname(open ? pathname : null)}
            />
          </div>
        </div>
      </div>

      <NavigationGlassDefs mapRef={glassMapRef} />
    </header>
  );
}
