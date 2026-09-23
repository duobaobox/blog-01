/**
 * 站点图片可用的远程主机白名单。
 *
 * 这里是唯一事实源：`next.config.ts` 的 `images.remotePatterns` 与写入时的 URL
 * 校验都读它。两处一旦不一致就会出事——校验放过了 next/image 未配置的主机，
 * 渲染时 next/image 会直接抛错并让整页 500。
 */
export const ALLOWED_IMAGE_REMOTE_PATTERNS = [
  { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
] as const;

/**
 * 主机是否匹配某个白名单模式。支持 `**.example.com` 这种前缀通配，
 * 也表示匹配裸域 `example.com`。
 */
export function matchesAllowedImageHostname(hostname: string, pattern: string) {
  const normalizedHost = hostname.toLowerCase();
  const normalizedPattern = pattern.toLowerCase();

  if (normalizedPattern.startsWith("**.")) {
    const suffix = normalizedPattern.slice(3);
    return normalizedHost === suffix || normalizedHost.endsWith(`.${suffix}`);
  }

  return normalizedHost === normalizedPattern;
}

/**
 * 是否为可交给 next/image 渲染的地址。
 *
 * 站内相对路径（媒体库写入的 `/media/xxx`）与白名单远程主机之外的地址一律为 false，
 * 用来在写入时就拦住会让页面崩溃的值。
 */
export function isRenderableImageUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//") && !trimmed.includes("\\");
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  // URL.protocol 带尾冒号（"https:"），白名单里沿用 Next 的写法（"https"）。
  const protocol = url.protocol.slice(0, -1);

  return ALLOWED_IMAGE_REMOTE_PATTERNS.some(
    (pattern) =>
      pattern.protocol === protocol &&
      matchesAllowedImageHostname(url.hostname, pattern.hostname),
  );
}
