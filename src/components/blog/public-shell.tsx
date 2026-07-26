import type { ReactNode } from "react";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import { cn } from "@/shared/lib/utils";
import { Footer } from "@/shared/ui/footer";
import { Header } from "@/shared/ui/header";

export type PublicSurface =
  | "default"
  | "home"
  | (string & Record<never, never>);

type PublicShellProps = {
  children: ReactNode;
  surface?: PublicSurface;
  overlapHeader?: boolean;
  className?: string;
  mainClassName?: string;
};

export async function PublicShell({
  children,
  surface = "default",
  overlapHeader = true,
  className,
  mainClassName,
}: PublicShellProps) {
  const site = await getResolvedSiteConfig();

  return (
    <div
      className={cn("flex min-h-dvh min-w-0 flex-col", className)}
      data-public-shell
      data-public-surface={surface}
    >
      <Header siteName={site.name} logo={site.logo} nav={site.nav} />

      <main
        data-public-surface={surface}
        className={cn(
          "public-main min-w-0 flex-1",
          overlapHeader && "-mt-14",
          mainClassName,
        )}
      >
        {children}
      </main>

      <Footer
        siteName={site.name}
        footerText={site.footerText}
        overlap={surface === "home"}
      />
    </div>
  );
}
