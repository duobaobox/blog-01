import { normalizeContentJson } from "@/features/editor/content-types";

export type PostMediaReferenceUsage = "cover" | "content";

export type PostMediaReferenceInput = {
  mediaId: string;
  usage: PostMediaReferenceUsage;
};

type ResolvedMediaRecord = {
  id: string;
  url: string;
};

function collectContentImageUrls(
  node: unknown,
  urls: Set<string>,
) {
  if (!node || typeof node !== "object") {
    return;
  }

  const candidate = node as {
    type?: unknown;
    attrs?: Record<string, unknown>;
    content?: unknown[];
  };

  if (
    candidate.type === "image" &&
    typeof candidate.attrs?.src === "string" &&
    candidate.attrs.src.trim()
  ) {
    urls.add(candidate.attrs.src.trim());
  }

  if (Array.isArray(candidate.content)) {
    for (const child of candidate.content) {
      collectContentImageUrls(child, urls);
    }
  }
}

export function extractContentImageUrls(contentJson: unknown) {
  const urls = new Set<string>();
  const normalizedContent = normalizeContentJson(contentJson);

  collectContentImageUrls(normalizedContent, urls);

  return [...urls];
}

export function collectCandidateMediaUrls(input: {
  coverImageUrl: string | null;
  contentJson: unknown;
}) {
  const urls = new Set<string>();

  if (input.coverImageUrl) {
    urls.add(input.coverImageUrl);
  }

  for (const url of extractContentImageUrls(input.contentJson)) {
    urls.add(url);
  }

  return [...urls];
}

export function buildPostMediaReferenceInputs(input: {
  coverImageUrl: string | null;
  contentJson: unknown;
}, mediaRecords: ResolvedMediaRecord[]): PostMediaReferenceInput[] {
  const references = new Map<string, PostMediaReferenceInput>();
  const mediaByUrl = new Map(mediaRecords.map((record) => [record.url, record]));

  if (input.coverImageUrl) {
    const media = mediaByUrl.get(input.coverImageUrl);

    if (media) {
      references.set(`${media.id}:cover`, {
        mediaId: media.id,
        usage: "cover",
      });
    }
  }

  for (const url of extractContentImageUrls(input.contentJson)) {
    const media = mediaByUrl.get(url);

    if (media) {
      references.set(`${media.id}:content`, {
        mediaId: media.id,
        usage: "content",
      });
    }
  }

  return [...references.values()];
}
