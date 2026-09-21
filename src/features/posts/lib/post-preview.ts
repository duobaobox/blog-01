/**
 * 列表卡片与 RSS 摘要使用的有界正文前缀。
 *
 * `contentText` 是物化后的完整正文（平均数 KB），公开列表只为渲染一两行预览
 * 就把它整篇拉出来并不划算，因此服务端另外物化 `previewText`：
 * 存 contentText 的前 200 字，列表卡片再从中取 120 字。
 */
export const POST_PREVIEW_MAX_LENGTH = 200;

/** 列表卡片摘要展示长度。 */
export const POST_CARD_PREVIEW_LENGTH = 120;

export function buildPostPreviewText(contentText: string) {
  const normalized = contentText.trim();
  return normalized ? normalized.slice(0, POST_PREVIEW_MAX_LENGTH) : null;
}

/**
 * 卡片摘要：作者填写了 excerpt 就优先用，否则回退到物化的 previewText。
 * 与旧的“回退到 contentText 前 120 字”行为保持一致。
 */
export function resolvePostCardPreview(input: {
  excerpt: string | null;
  previewText: string | null;
}) {
  const excerpt = input.excerpt?.trim();

  if (excerpt) {
    return excerpt;
  }

  const previewText = input.previewText?.trim() ?? "";
  const preview = previewText.slice(0, POST_CARD_PREVIEW_LENGTH);

  if (!preview) {
    return "";
  }

  return `${preview}${previewText.length > POST_CARD_PREVIEW_LENGTH ? "..." : ""}`;
}
