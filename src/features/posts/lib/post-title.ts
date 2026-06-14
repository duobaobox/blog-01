export const UNTITLED_POST_TITLE_PREFIX = "未命名";
export const UNTITLED_POST_TITLE = `${UNTITLED_POST_TITLE_PREFIX} 1`;

export function getPostDisplayTitle(title?: string | null) {
  return title?.trim() || UNTITLED_POST_TITLE;
}

export function getUntitledPostTitleByIndex(index: number) {
  return `${UNTITLED_POST_TITLE_PREFIX} ${Math.max(1, index)}`;
}
