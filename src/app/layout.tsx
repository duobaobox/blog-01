export const revalidate = 300;

import type { Metadata } from "next";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import { ThemeProvider } from "@/shared/ui/theme-provider";
// Tiptap 变量与关键帧作为独立全局入口在此引入（Sass 编译），不要写回 globals.css
// 的跨目录相对 @import：Turbopack 按项目根解析，会启动报 Can't resolve。
import "@/styles/_variables.scss";
import "@/styles/_keyframe-animations.scss";
import "./globals.css";
import "./public-theme.css";
import "./public-home.css";
import "./public-header.css";
import "./public-footer.css";

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
