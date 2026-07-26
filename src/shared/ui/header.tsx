"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  buildNavigationGlassMap,
  resolveNavigationCondensedState,
} from "@/shared/lib/navigation-liquid-glass";

interface HeaderProps {
  siteName: string;
  logo?: MediaPresentation;
  nav: ReadonlyArray<{
    label: string;
    href: string;
  }>;
}

const NAVIGATION_GLASS_RED_DISPLACEMENT = -16; // 不要超过导航高度一半，避免上下采样穿过中线
const NAVIGATION_GLASS_GREEN_DISPLACEMENT = -16; // 与红蓝保持小差距，产生轻微色散
const NAVIGATION_GLASS_BLUE_DISPLACEMENT = -16; // 绝对值越大，蓝色通道折射越强
const NAVIGATION_GLASS_EDGE_BLUR = 0.2; // 越大边缘越柔和，也越容易产生重影

export function Header({ siteName, logo, nav }: HeaderProps) {
  const pathname = usePathname();
  const shellRef = useRef<HTMLDivElement>(null);
  const glassMapRef = useRef<SVGFEImageElement>(null);
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigationOpen = openPathname === pathname;

  useEffect(() => {
    let frame = 0;
    let mapTimer: ReturnType<typeof setTimeout> | null = null;
    let condensed = resolveNavigationCondensedState(false, window.scrollY);

    function syncGlassMap() {
      const shell = shellRef.current;
      const glassMap = glassMapRef.current;
      if (!shell || !glassMap) return;

      const rect = shell.getBoundingClientRect();
      const uri = buildNavigationGlassMap(rect.width, rect.height);
      glassMap.setAttribute("href", uri);
      glassMap.setAttributeNS("http://www.w3.org/1999/xlink", "href", uri);
    }

    function scheduleGlassMap() {
      if (mapTimer) clearTimeout(mapTimer);
      mapTimer = setTimeout(syncGlassMap, 140);
    }

    function handleScroll() {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        const nextCondensed = resolveNavigationCondensedState(
          condensed,
          window.scrollY,
        );

        if (nextCondensed !== condensed) {
          condensed = nextCondensed;
          setIsScrolled(condensed);
          scheduleGlassMap();
        }

        frame = 0;
      });
    }

    syncGlassMap();
    frame = window.requestAnimationFrame(() => {
      setIsScrolled(condensed);
      frame = 0;
    });

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleGlassMap);
    if (shellRef.current) resizeObserver?.observe(shellRef.current);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", scheduleGlassMap, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", scheduleGlassMap);
      resizeObserver?.disconnect();
      if (mapTimer) clearTimeout(mapTimer);
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
      <div
        ref={shellRef}
        className="public-header__shell mx-auto h-full max-w-5xl px-4 sm:px-6"
      >
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
              onOpenChange={(open) => setOpenPathname(open ? pathname : null)}
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

      <svg
        className="public-header__glass-defs"
        aria-hidden="true"
        focusable="false"
        width="0"
        height="0"
      >
        <defs>
          <filter id="public-nav-liquid-glass" colorInterpolationFilters="sRGB">
            <feImage
              ref={glassMapRef}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="map"
              data-navigation-glass-map
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              xChannelSelector="R"
              yChannelSelector="B"
              scale={NAVIGATION_GLASS_RED_DISPLACEMENT}
              result="displacedRed"
            />
            <feColorMatrix
              in="displacedRed"
              type="matrix"
              values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
              result="red"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              xChannelSelector="R"
              yChannelSelector="B"
              scale={NAVIGATION_GLASS_GREEN_DISPLACEMENT}
              result="displacedGreen"
            />
            <feColorMatrix
              in="displacedGreen"
              type="matrix"
              values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
              result="green"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              xChannelSelector="R"
              yChannelSelector="B"
              scale={NAVIGATION_GLASS_BLUE_DISPLACEMENT}
              result="displacedBlue"
            />
            <feColorMatrix
              in="displacedBlue"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"
              result="blue"
            />
            <feBlend in="red" in2="green" mode="screen" result="redGreen" />
            <feBlend in="redGreen" in2="blue" mode="screen" result="output" />
            <feGaussianBlur
              in="output"
              stdDeviation={NAVIGATION_GLASS_EDGE_BLUR}
            />
          </filter>
        </defs>
      </svg>
    </header>
  );
}
