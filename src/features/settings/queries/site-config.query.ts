import { unstable_cache } from "next/cache";
import {
  resolveMediaPresentationMap,
  type MediaPresentation,
} from "@/features/media/queries/media.queries";
import {
  PUBLIC_CACHE_REVALIDATE_SECONDS,
  PUBLIC_CACHE_TAGS,
} from "@/infrastructure/cache/public-cache";
import * as settingsRepo from "@/features/settings/repositories/settings.repository";
import { siteConfig } from "@/shared/config/site.config";
import { normalizeSiteUrl } from "@/shared/lib/url";

export interface ResolvedSiteConfig {
  name: string;
  description: string;
  url: string;
  updatedAt?: Date;
  nav: ReadonlyArray<{ label: string; href: string }>;
  social: {
    github: string;
    x: string;
    email: string;
  };
  footerText?: string;
  subtitle?: string;
  logo?: MediaPresentation;
  avatar?: MediaPresentation;
  logoUrl?: string;
  avatarUrl?: string;
}

function buildMediaPresentation(
  url: string | null | undefined,
  mediaByUrl: Map<string, MediaPresentation>,
) {
  if (!url) {
    return undefined;
  }

  return mediaByUrl.get(url) ?? {
    url,
    width: null,
    height: null,
    alt: null,
  };
}

type ResolvedSiteConfigDependencies = {
  findSiteSettings: typeof settingsRepo.findSiteSettings;
  resolveMediaPresentationMap: typeof resolveMediaPresentationMap;
};

export function createResolvedSiteConfigQuery(
  dependencies: ResolvedSiteConfigDependencies = {
    findSiteSettings: settingsRepo.findSiteSettings,
    resolveMediaPresentationMap,
  },
) {
  return async function getResolvedSiteConfigUncached(): Promise<ResolvedSiteConfig> {
    let dbSettings: Awaited<ReturnType<typeof settingsRepo.findSiteSettings>> = null;

    try {
      dbSettings = await dependencies.findSiteSettings();
    } catch {
      // 数据库查询失败时，回退到静态站点配置
    }

    if (dbSettings) {
      const mediaByUrl = await dependencies.resolveMediaPresentationMap([
        dbSettings.logoUrl,
        dbSettings.avatarUrl,
      ]);
      const logo = buildMediaPresentation(dbSettings.logoUrl, mediaByUrl);
      const avatar = buildMediaPresentation(dbSettings.avatarUrl, mediaByUrl);

      return {
        name: dbSettings.siteTitle,
        description: dbSettings.siteDescription ?? siteConfig.description,
        url: normalizeSiteUrl(dbSettings.siteUrl),
        updatedAt: dbSettings.updatedAt,
        nav: siteConfig.nav,
        social: {
          github: dbSettings.githubUrl ?? "",
          x: dbSettings.xUrl ?? "",
          email: dbSettings.email ?? "",
        },
        footerText: dbSettings.footerText ?? undefined,
        subtitle: dbSettings.siteSubtitle ?? undefined,
        logo,
        avatar,
        logoUrl: logo?.url,
        avatarUrl: avatar?.url,
      };
    }

    return {
      name: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.url,
      nav: siteConfig.nav,
      social: siteConfig.social,
    };
  };
}

const getResolvedSiteConfigCached = unstable_cache(
  createResolvedSiteConfigQuery(),
  ["resolved-site-config"],
  {
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    tags: [PUBLIC_CACHE_TAGS.site],
  },
);

export async function getResolvedSiteConfig(): Promise<ResolvedSiteConfig> {
  return getResolvedSiteConfigCached();
}
