export type PostWorkflowTaskInput = {
  title: string;
  excerpt: string;
  coverImageUrl: string;
  seoTitle: string;
  seoDescription: string;
  subtopicId: string;
  contentText: string;
  status: string;
};

export type PostWorkflowTask = {
  id: string;
  title: string;
  description: string;
  tone: "draft" | "structure" | "publish";
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function buildPostWorkflowTasks(
  input: PostWorkflowTaskInput,
): PostWorkflowTask[] {
  const tasks: PostWorkflowTask[] = [];

  if (!hasText(input.title)) {
    tasks.push({
      id: "title",
      title: "先定一个标题",
      description:
        "标题还是空的，先把主题说清楚，后面的结构和发布判断才会稳定。",
      tone: "draft",
    });
  }

  if (!hasText(input.subtopicId)) {
    tasks.push({
      id: "subtopic",
      title: "归到一个子专题",
      description:
        "先把文章放进明确分支，后面回来看时才不会变成孤立草稿。",
      tone: "structure",
    });
  }

  if (!hasText(input.contentText)) {
    tasks.push({
      id: "content",
      title: "补一个开头",
      description:
        "正文还是空的，哪怕先写一段开头，也能让这篇进入可继续推进的状态。",
      tone: "draft",
    });
  }

  if (
    hasText(input.title) &&
    hasText(input.contentText) &&
    !hasText(input.excerpt)
  ) {
    tasks.push({
      id: "excerpt",
      title: "补一句摘要",
      description:
        "摘要还空着，列表和后续发布判断都会缺少一个明确的内容概括。",
      tone: "draft",
    });
  }

  if (
    hasText(input.title) &&
    hasText(input.contentText) &&
    !hasText(input.coverImageUrl)
  ) {
    tasks.push({
      id: "cover",
      title: "加一张封面",
      description:
        "这篇已经具备正文和主题，可以补一张封面增强首屏识别度。",
      tone: "publish",
    });
  }

  if (
    input.status === "published" &&
    (!hasText(input.seoTitle) || !hasText(input.seoDescription))
  ) {
    tasks.push({
      id: "seo",
      title: "补齐 SEO 信息",
      description:
        "正文已经可以对外展示了，把搜索标题和描述补齐，方便后续分发和检索。",
      tone: "publish",
    });
  }

  return tasks.slice(0, 3);
}
