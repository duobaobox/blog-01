import {
  getResolvedSiteConfig,
  type ResolvedSiteConfig,
} from "@/features/settings/queries/site-config.query";
import {
  getPublishedForFeed,
  getPublishedSlugs,
} from "@/features/posts/queries/post.queries";
import { getPublicCategories } from "@/features/taxonomy/queries/category.queries";
import { getPublicTags } from "@/features/taxonomy/queries/tag.queries";

type PublicSitemapPost = Awaited<ReturnType<typeof getPublishedSlugs>>[number];
type PublicSitemapCategory = Awaited<
  ReturnType<typeof getPublicCategories>
>[number];
type PublicSitemapTag = Awaited<ReturnType<typeof getPublicTags>>[number];
type PublicFeedPost = Awaited<ReturnType<typeof getPublishedForFeed>>[number];

type PublicSiteMetadataDependencies = {
  getResolvedSiteConfig: () => Promise<ResolvedSiteConfig>;
  getPublishedSlugs: typeof getPublishedSlugs;
  getPublishedForFeed: typeof getPublishedForFeed;
  getPublicCategories: typeof getPublicCategories;
  getPublicTags: typeof getPublicTags;
};

export interface PublicSitemapData {
  site: ResolvedSiteConfig;
  blogLastModified?: Date;
  posts: PublicSitemapPost[];
  categories: PublicSitemapCategory[];
  tags: PublicSitemapTag[];
}

export interface PublicFeedData {
  site: Pick<ResolvedSiteConfig, "name" | "description" | "url">;
  posts: PublicFeedPost[];
}

export interface PublicRobotsData {
  site: Pick<ResolvedSiteConfig, "url">;
}

function getLatestDate(dates: Array<Date | null | undefined>) {
  return dates.reduce<Date | undefined>((latest, value) => {
    if (!value) {
      return latest;
    }

    if (!latest || value > latest) {
      return value;
    }

    return latest;
  }, undefined);
}

export function createPublicSiteMetadataQueries(
  dependencies: PublicSiteMetadataDependencies = {
    getResolvedSiteConfig,
    getPublishedSlugs,
    getPublishedForFeed,
    getPublicCategories,
    getPublicTags,
  },
) {
  return {
    async getSitemapData(): Promise<PublicSitemapData> {
      const [site, posts, categories, tags] = await Promise.all([
        dependencies.getResolvedSiteConfig(),
        dependencies.getPublishedSlugs(),
        dependencies.getPublicCategories(),
        dependencies.getPublicTags(),
      ]);

      const blogLastModified = getLatestDate([
        site.updatedAt,
        ...posts.map((post) => post.updatedAt),
        ...categories.map((category) => category.updatedAt),
        ...tags.map((tag) => tag.updatedAt),
      ]);

      return {
        site,
        blogLastModified,
        posts,
        categories,
        tags,
      };
    },
    async getFeedData(take = 20): Promise<PublicFeedData> {
      const [site, posts] = await Promise.all([
        dependencies.getResolvedSiteConfig(),
        dependencies.getPublishedForFeed(take),
      ]);

      return {
        site: {
          name: site.name,
          description: site.description,
          url: site.url,
        },
        posts,
      };
    },
    async getRobotsData(): Promise<PublicRobotsData> {
      const site = await dependencies.getResolvedSiteConfig();

      return {
        site: {
          url: site.url,
        },
      };
    },
  };
}

const publicSiteMetadataQueries = createPublicSiteMetadataQueries();

export const getPublicSitemapData = publicSiteMetadataQueries.getSitemapData;
export const getPublicFeedData = publicSiteMetadataQueries.getFeedData;
export const getPublicRobotsData = publicSiteMetadataQueries.getRobotsData;
