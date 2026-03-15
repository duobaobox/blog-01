import { cache } from "react";
import { db } from "@/infrastructure/db";
import { siteConfig } from "@/shared/config/site.config";

export interface ResolvedSiteConfig {
  name: string;
  description: string;
  url: string;
  nav: ReadonlyArray<{ label: string; href: string }>;
  social: {
    github: string;
    x: string;
    email: string;
  };
  footerText?: string;
  subtitle?: string;
  logoUrl?: string;
  avatarUrl?: string;
}

export const getResolvedSiteConfig = cache(
  async (): Promise<ResolvedSiteConfig> => {
    let dbSettings: Awaited<ReturnType<typeof db.siteSetting.findFirst>> = null;

    try {
      dbSettings = await db.siteSetting.findFirst();
    } catch {
      // 数据库查询失败时，回退到静态站点配置
    }

    if (dbSettings) {
      return {
        name: dbSettings.siteTitle,
        description: dbSettings.siteDescription ?? siteConfig.description,
        url: dbSettings.siteUrl,
        nav: siteConfig.nav,
        social: {
          github: dbSettings.githubUrl ?? "",
          x: dbSettings.xUrl ?? "",
          email: dbSettings.email ?? "",
        },
        footerText: dbSettings.footerText ?? undefined,
        subtitle: dbSettings.siteSubtitle ?? undefined,
        logoUrl: dbSettings.logoUrl ?? undefined,
        avatarUrl: dbSettings.avatarUrl ?? undefined,
      };
    }

    return {
      name: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.url,
      nav: siteConfig.nav,
      social: siteConfig.social,
    };
  },
);
