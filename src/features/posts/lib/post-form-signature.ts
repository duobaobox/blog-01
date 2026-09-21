/**
 * 文章表单的变更检测。
 *
 * 早期实现把整个表单 `JSON.stringify` 成一个快照字符串再比较，而 `contentJson`
 * 是整篇文档的字符串——每次按键都要在更新前后各序列化一遍，是 O(正文长度) 的额外分配，
 * 长文下会拖慢输入。
 *
 * 这里改为字段级比较：未改动的字段走引用相等直接短路，`contentJson` 只做一次字符串比较，
 * 不产生新的长字符串。语义与旧实现完全一致（见下方「不参与变更检测的字段」说明）。
 */

/** 参与变更检测的字段。 */
export type PostFormSignatureInput = {
  title: string;
  excerpt: string;
  coverImageUrl: string;
  contentJson: string;
  categoryId: string;
  folderId: string;
  selectedTagIds: string[];
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  status: string;
};

export type PostFormSignature = PostFormSignatureInput;

function areTagIdsEqual(left: string[], right: string[]) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  // 标签是不区分顺序的集合，比较前统一排序。
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();

  return sortedLeft.every((id, index) => id === sortedRight[index]);
}

/**
 * 不参与变更检测的字段：`contentText`、字数、阅读时长等由正文派生的值。
 * 它们随 `contentJson` 一起变化，单独变化不构成需要保存的修改。
 */
export function createPostFormSignature(
  form: PostFormSignatureInput,
): PostFormSignature {
  return {
    title: form.title,
    excerpt: form.excerpt,
    coverImageUrl: form.coverImageUrl,
    contentJson: form.contentJson,
    categoryId: form.categoryId,
    folderId: form.folderId,
    selectedTagIds: [...form.selectedTagIds].sort(),
    isFeatured: form.isFeatured,
    seoTitle: form.seoTitle,
    seoDescription: form.seoDescription,
    canonicalUrl: form.canonicalUrl,
    status: form.status,
  };
}

export function arePostFormSignaturesEqual(
  left: PostFormSignature,
  right: PostFormSignature,
) {
  return (
    left.title === right.title &&
    left.excerpt === right.excerpt &&
    left.coverImageUrl === right.coverImageUrl &&
    left.contentJson === right.contentJson &&
    left.categoryId === right.categoryId &&
    left.folderId === right.folderId &&
    areTagIdsEqual(left.selectedTagIds, right.selectedTagIds) &&
    left.isFeatured === right.isFeatured &&
    left.seoTitle === right.seoTitle &&
    left.seoDescription === right.seoDescription &&
    left.canonicalUrl === right.canonicalUrl &&
    left.status === right.status
  );
}

export function isPostFormDirty(
  form: PostFormSignatureInput,
  baseline: PostFormSignature,
) {
  return !arePostFormSignaturesEqual(createPostFormSignature(form), baseline);
}
