export const revalidate = 300;

import type { Metadata } from "next";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import { ThemeProvider } from "@/shared/ui/theme-provider";
import "./globals.css";
import "./public-theme.css";
import "./public-home.css";
import "./public-header.css";
import "./public-footer.css";
import "./tiptap-content.scss";
import "./editor.css";

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
    icons: site.faviconUrl
      ? {
          icon: [{ url: site.faviconUrl }],
          shortcut: [{ url: site.faviconUrl }],
          apple: [{ url: site.faviconUrl }],
        }
      : undefined,
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
      <body className="overflow-x-clip antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
