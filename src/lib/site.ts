import { cache } from "react";
import { db } from "@/lib/db";
import { siteConfig } from "@/site.config";

type SiteNavItem = {
  label: string;
  href: string;
};

export interface ResolvedSiteConfig {
  name: string;
  description: string;
  url: string;
  nav: readonly SiteNavItem[];
  social: {
    github: string;
    x: string;
    email: string;
  };
  footerText: string;
  subtitle: string | null;
  logoUrl: string | null;
  avatarUrl: string | null;
}

function trimOrNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const getResolvedSiteConfig = cache(
  async (): Promise<ResolvedSiteConfig> => {
    try {
      const settings = await db.siteSetting.findFirst();
      const hasSettings = Boolean(settings);
      const name = trimOrNull(settings?.siteTitle) ?? siteConfig.name;

      return {
        name,
        description:
          trimOrNull(settings?.siteDescription) ?? siteConfig.description,
        url: trimOrNull(settings?.siteUrl) ?? siteConfig.url,
        nav: siteConfig.nav,
        social: {
          github: hasSettings
            ? trimOrNull(settings?.githubUrl) ?? ""
            : siteConfig.social.github,
          x: hasSettings
            ? trimOrNull(settings?.xUrl) ?? ""
            : siteConfig.social.x,
          email: hasSettings
            ? trimOrNull(settings?.email) ?? ""
            : siteConfig.social.email,
        },
        footerText:
          trimOrNull(settings?.footerText) ??
          `© ${new Date().getFullYear()} ${name}. All rights reserved.`,
        subtitle: trimOrNull(settings?.siteSubtitle),
        logoUrl: trimOrNull(settings?.logoUrl),
        avatarUrl: trimOrNull(settings?.avatarUrl),
      };
    } catch {
      return {
        name: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.url,
        nav: siteConfig.nav,
        social: siteConfig.social,
        footerText: `© ${new Date().getFullYear()} ${siteConfig.name}. All rights reserved.`,
        subtitle: null,
        logoUrl: null,
        avatarUrl: null,
      };
    }
  },
);
