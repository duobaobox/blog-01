import type { Metadata } from "next";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { getResolvedSiteConfig } from "@/lib/site";
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
    alternates: {
      canonical: site.url,
    },
    openGraph: {
      title: site.name,
      description: site.description,
      siteName: site.name,
      url: site.url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: site.name,
      description: site.description,
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
