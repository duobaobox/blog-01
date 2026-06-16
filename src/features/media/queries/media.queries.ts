import { unstable_cache } from "next/cache";
import {
  ADMIN_CACHE_REVALIDATE_SECONDS,
  ADMIN_CACHE_TAGS,
} from "@/infrastructure/cache/admin-cache";
import { buildMediaReferences } from "@/features/media/lib/media-reference";
import { normalizeStorageProvider } from "@/features/media/lib/media-storage";
import * as mediaRepo from "@/features/media/repositories/media.repository";
import * as postRepo from "@/features/posts/repositories/post.repository";
import type { MediaItem } from "@/features/media/types/storage.types";
import { isProductionBuildPhase } from "@/shared/lib/runtime-phase";

export type MediaPresentation = {
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  variants?: MediaPresentationVariants;
};

export type MediaPresentationVariant = {
  url: string;
  width: number | null;
  height: number | null;
};

export type MediaPresentationVariants = {
  thumbnail: MediaPresentationVariant;
  card: MediaPresentationVariant;
  original: MediaPresentationVariant;
};

type MediaPresentationRecord = {
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
};

function buildVariant(
  record: MediaPresentationRecord,
  targetWidth: number,
): MediaPresentationVariant {
  if (!record.width || !record.height) {
    return {
      url: record.url,
      width: record.width,
      height: record.height,
    };
  }

  const width = Math.min(record.width, targetWidth);
  const height = Math.round((record.height / record.width) * width);

  return {
    url: record.url,
    width,
    height,
  };
}

export function buildMediaPresentation(
  record: MediaPresentationRecord,
): MediaPresentation {
  return {
    url: record.url,
    width: record.width,
    height: record.height,
    alt: record.alt,
    variants: {
      thumbnail: buildVariant(record, 320),
      card: buildVariant(record, 960),
      original: {
        url: record.url,
        width: record.width,
        height: record.height,
      },
    },
  };
}

function toMediaItem(media: Awaited<ReturnType<typeof mediaRepo.findMediaById>>): MediaItem | null {
  if (!media) {
    return null;
  }

  return {
    ...media,
    storageProvider: normalizeStorageProvider(media.storageProvider),
  };
}

export async function getMediaList(options?: mediaRepo.FindMediaOptions) {
  if (!options?.mimeTypePrefix && !options?.take && !options?.skip) {
    return getAdminMediaListCached();
  }

  const items = await mediaRepo.findMedia(options);
  return items.map((item) => ({
    ...item,
    storageProvider: normalizeStorageProvider(item.storageProvider),
  })) satisfies MediaItem[];
}

export type AdminMediaPageData = {
  items: MediaItem[];
};

type AdminMediaPageDataDependencies = {
  isProductionBuildPhase: () => boolean;
  getMediaList: () => Promise<MediaItem[]>;
};

export function createAdminMediaPageDataQuery(
  dependencies: AdminMediaPageDataDependencies = {
    isProductionBuildPhase,
    getMediaList: () => getMediaList(),
  },
) {
  return async function getAdminMediaPageData(): Promise<AdminMediaPageData> {
    if (dependencies.isProductionBuildPhase()) {
      return {
        items: [],
      };
    }

    return {
      items: await dependencies.getMediaList(),
    };
  };
}

const getAdminMediaPageDataQuery = createAdminMediaPageDataQuery();

export async function getAdminMediaPageData(): Promise<AdminMediaPageData> {
  return getAdminMediaPageDataQuery();
}

let getAdminMediaListCachedQuery: (() => Promise<MediaItem[]>) | null = null;

function getAdminMediaListCached() {
  getAdminMediaListCachedQuery ??= unstable_cache(
    async () => {
      const items = await mediaRepo.findMedia();
      return items.map((item) => ({
        ...item,
        storageProvider: normalizeStorageProvider(item.storageProvider),
      })) satisfies MediaItem[];
    },
    ["admin-media-list"],
    {
      revalidate: ADMIN_CACHE_REVALIDATE_SECONDS,
      tags: [ADMIN_CACHE_TAGS.media],
    },
  );

  return getAdminMediaListCachedQuery();
}

export async function getMediaById(id: string) {
  const media = await mediaRepo.findMediaById(id);
  return toMediaItem(media);
}

export async function getMediaCount(mimeTypePrefix?: string) {
  return mediaRepo.countMedia(mimeTypePrefix);
}

export async function getMediaReferences(mediaId: string) {
  const posts = await postRepo.findPostsReferencingMedia(mediaId);
  return buildMediaReferences(posts);
}

type MediaPresentationRepository = Pick<typeof mediaRepo, "findMediaByUrls">;

export function createResolveMediaPresentationMapQuery(
  repo: MediaPresentationRepository = mediaRepo,
) {
  return async function resolveMediaPresentationMap(
    urls: Array<string | null | undefined>,
  ) {
    const normalizedUrls = [...new Set(
      urls
        .filter((url): url is string => typeof url === "string")
        .map((url) => url.trim())
        .filter(Boolean),
    )];

    const records = await repo.findMediaByUrls(normalizedUrls);

    return new Map(
      records.map((record) => [
        record.url,
        buildMediaPresentation(record),
      ]),
    );
  };
}

export const resolveMediaPresentationMap =
  createResolveMediaPresentationMapQuery();
