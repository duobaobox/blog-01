import type { MediaItem } from "@/features/media/types/storage.types";

type MediaPickerResponse = {
  items?: unknown;
  error?: unknown;
};

type MediaPickerFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

function getResponseError(
  payload: MediaPickerResponse | null,
  fallback: string,
) {
  return typeof payload?.error === "string" && payload.error.trim()
    ? payload.error
    : fallback;
}

export async function fetchMediaPickerItems(options?: {
  mimeTypePrefix?: string;
  signal?: AbortSignal;
  fetcher?: MediaPickerFetch;
}): Promise<MediaItem[]> {
  const params = new URLSearchParams();
  const mimeTypePrefix = options?.mimeTypePrefix?.trim();

  if (mimeTypePrefix) {
    params.set("mimeTypePrefix", mimeTypePrefix);
  }

  const query = params.toString();
  const response = await (options?.fetcher ?? fetch)(
    `/api/media${query ? `?${query}` : ""}`,
    {
      cache: "no-store",
      credentials: "same-origin",
      signal: options?.signal,
    },
  );
  const payload = (await response.json().catch(() => null)) as
    | MediaPickerResponse
    | null;

  if (!response.ok) {
    throw new Error(getResponseError(payload, "媒体库加载失败"));
  }

  if (!Array.isArray(payload?.items)) {
    throw new Error("媒体库返回了无法识别的数据");
  }

  return payload.items as MediaItem[];
}
