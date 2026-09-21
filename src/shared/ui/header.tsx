"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import type { MediaPresentation } from "@/features/media/queries/media.queries";
import { useNavigationGlass } from "@/shared/hooks/use-navigation-glass";
import {
  isNavigationItemActive,
  type NavigationItem,
} from "@/shared/lib/navigation";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button-variants";
import { NavigationGlassDefs } from "@/shared/ui/navigation-glass-defs";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

const MOBILE_NAVIGATION_TRIGGER_ID = "public-mobile-navigation-trigger";

/**
 * 抽屉内容按需加载：base-ui 的 dialog 运行时只有移动端访客第一次点开菜单时才会下载，
 * 桌面访客完全不加载。
 */
const MobileNavigationSheet = dynamic(
  () =>
    import("@/shared/ui/mobile-navigation-sheet").then(
      (module) => module.MobileNavigationSheet,
    ),
  { ssr: false },
);

interface HeaderProps {
  siteName: string;
  logo?: MediaPresentation;
  nav: ReadonlyArray<NavigationItem>;
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
  const [sheetMounted, setSheetMounted] = useState(false);

  return (
    <>
      <button
        type="button"
        id={MOBILE_NAVIGATION_TRIGGER_ID}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setSheetMounted(true);
          onOpenChange(true);
        }}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "public-menu-button md:hidden",
        )}
      >
        <Menu aria-hidden="true" />
        <span className="sr-only">菜单</span>
      </button>

      {sheetMounted ? (
        <MobileNavigationSheet
          pathname={pathname}
          nav={nav}
          open={open}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </>
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
