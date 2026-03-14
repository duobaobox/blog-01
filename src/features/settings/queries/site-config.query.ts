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
    const dbSettings = await db.siteSetting.findFirst();

    if (dbSettings) {
      return {
        name: dbSettings.siteTitle,
        description: dbSettings.siteDescription ?? siteConfig.description,
        url: dbSettings.siteUrl,
        nav: siteConfig.nav,
        social: {
          github: dbSettings.githubUrl ?? siteConfig.social.github,
          x: dbSettings.xUrl ?? siteConfig.social.x,
          email: dbSettings.email ?? siteConfig.social.email,
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
  }
);
