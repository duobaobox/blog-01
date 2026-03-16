export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { ThemeProvider } from "@/shared/ui/theme-provider";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getResolvedSiteConfig();
  const metadataBase = (() => {
    try {
      return new URL(site.url);
    } catch {
      return undefined;
    }
  })();

  return {
    ...(metadataBase ? { metadataBase } : {}),
    title: {
      default: site.name,
      template: `%s | ${site.name}`,
    },
    description: site.description,
    openGraph: {
      siteName: site.name,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
