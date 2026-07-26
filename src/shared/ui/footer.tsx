import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface FooterProps {
  siteName: string;
  footerText?: string;
  overlap?: boolean;
}

export function Footer({ siteName, footerText, overlap = false }: FooterProps) {
  const copyrightText =
    footerText?.trim() ||
    `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;

  return (
    <footer
      className={cn(
        "public-footer relative z-10 bg-transparent",
        overlap && "-mt-7 sm:-mt-9",
      )}
    >
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
