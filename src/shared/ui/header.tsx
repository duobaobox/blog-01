"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4 sm:px-6">
        <Link href="/" className="mr-6 flex items-center gap-3 font-bold">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={siteName}
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 rounded-lg border object-cover"
            />
          ) : null}
          <span>{siteName}</span>
        </Link>

        {/* 桌面端导航 */}
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground/80",
                pathname === item.href
                  ? "text-foreground"
                  : "text-foreground/60",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1">
          <ThemeToggle />

          {/* 移动端菜单 */}
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden" />
              }
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">菜单</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px]">
              <SheetTitle className="sr-only">导航菜单</SheetTitle>
              <nav className="mt-6 flex flex-col gap-2">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                      pathname === item.href
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
