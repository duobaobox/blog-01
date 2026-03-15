export const UNTITLED_POST_TITLE = "未命名文章";

export function getPostDisplayTitle(title?: string | null) {
  return title?.trim() || UNTITLED_POST_TITLE;
}
