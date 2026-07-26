import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";

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
    <footer className="public-footer border-t">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="public-footer__grid">
          <div className="public-footer__brand">
            <Link
              href="/"
              className="public-brand inline-flex"
              aria-label={`回到 ${siteName} 首页`}
            >
              <span className="public-brand__mark" aria-hidden="true">
                <span className="public-brand__spark" />
              </span>
              <span className="public-brand__copy min-w-0">
                <span className="truncate">{siteName}</span>
                <span className="public-brand__meta">OPEN NOTES / BLOG</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>

          <div>
            <p className="public-footer__kicker">Browse</p>
            <nav aria-label="页脚导航" className="public-footer__links">
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="public-footer__kicker">Connect</p>
            <div className="public-footer__links">
              {email ? <Link href={`mailto:${email}`}>Email</Link> : null}
              <Link href="/feed.xml">RSS</Link>
            </div>
          </div>

          <div className="public-footer__note">
            <span className="public-footer__note-dot" aria-hidden="true" />
            <div>
              <p className="font-medium text-foreground">Archive status</p>
              <p className="mt-1 leading-5 text-muted-foreground">
                Notes, experiments and practical lessons — kept open.
              </p>
            </div>
          </div>
        </div>

        <div className="public-footer__bottom">
          <p className="text-xs text-muted-foreground">{copyrightText}</p>
          <div className="flex items-center gap-3">
            {email ? (
              <Link
                href={`mailto:${email}`}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </Link>
            ) : null}
            <Link
              href="#top"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              回到顶部
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
