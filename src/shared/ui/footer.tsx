import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface FooterProps {
  siteName: string;
  description: string;
  email?: string;
  footerText?: string;
  nav: ReadonlyArray<{
    label: string;
    href: string;
  }>;
}

export function Footer({
  siteName,
  description,
  email,
  footerText,
  nav,
}: FooterProps) {
  const copyrightText =
    footerText?.trim() ||
    `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;

  return (
    <footer className="public-footer border-t border-border/60 bg-transparent">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/"
              className="text-sm font-semibold text-foreground no-underline"
              aria-label={`回到 ${siteName} 首页`}
            >
              {siteName}
            </Link>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>

          <nav
            aria-label="页脚导航"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground no-underline transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/feed.xml"
              className="text-muted-foreground no-underline transition-colors hover:text-foreground"
            >
              RSS
            </Link>
            {email ? (
              <Link
                href={`mailto:${email}`}
                className="text-muted-foreground no-underline transition-colors hover:text-foreground"
              >
                Email
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="mt-7 flex flex-col gap-2 border-t border-border/50 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{copyrightText}</p>
          <Link
            href="#top"
            className="inline-flex items-center gap-1 no-underline transition-colors hover:text-foreground"
          >
            回到顶部
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
