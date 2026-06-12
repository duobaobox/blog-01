import assert from "node:assert/strict";
import test from "node:test";
import { buildPostWorkflowTasks } from "./post-workflow-tasks";

function createInput(
  overrides?: Partial<Parameters<typeof buildPostWorkflowTasks>[0]>,
) {
  return {
    title: "一篇文章",
    excerpt: "这里是摘要",
    coverImageUrl: "https://example.com/cover.png",
    seoTitle: "SEO 标题",
    seoDescription: "SEO 描述",
    subtopicId: "subtopic-1",
    contentText: "这是正文内容，已经开始写了。",
    status: "draft",
    ...overrides,
  };
}

test("buildPostWorkflowTasks prioritizes missing title and subtopic for early drafts", () => {
  const tasks = buildPostWorkflowTasks(
    createInput({
      title: "",
      subtopicId: "",
      excerpt: "",
      contentText: "",
      coverImageUrl: "",
      seoTitle: "",
      seoDescription: "",
    }),
  );

  assert.deepEqual(tasks, [
    {
      id: "title",
      title: "先定一个标题",
      description: "标题还是空的，先把主题说清楚，后面的结构和发布判断才会稳定。",
      tone: "draft",
    },
    {
      id: "subtopic",
      title: "归到一个子专题",
      description: "先把文章放进明确分支，后面回来看时才不会变成孤立草稿。",
      tone: "structure",
    },
    {
      id: "content",
      title: "补一个开头",
      description: "正文还是空的，哪怕先写一段开头，也能让这篇进入可继续推进的状态。",
      tone: "draft",
    },
  ]);
});

test("buildPostWorkflowTasks points to excerpt and cover before publishing", () => {
  const tasks = buildPostWorkflowTasks(
    createInput({
      excerpt: "",
      coverImageUrl: "",
    }),
  );

  assert.deepEqual(tasks, [
    {
      id: "excerpt",
      title: "补一句摘要",
      description: "摘要还空着，列表和后续发布判断都会缺少一个明确的内容概括。",
      tone: "draft",
    },
    {
      id: "cover",
      title: "加一张封面",
      description: "这篇已经具备正文和主题，可以补一张封面增强首屏识别度。",
      tone: "publish",
    },
  ]);
});

test("buildPostWorkflowTasks points to SEO gaps for near-ready content", () => {
  const tasks = buildPostWorkflowTasks(
    createInput({
      status: "published",
      seoTitle: "",
      seoDescription: "",
    }),
  );

  assert.deepEqual(tasks, [
    {
      id: "seo",
      title: "补齐 SEO 信息",
      description: "正文已经可以对外展示了，把搜索标题和描述补齐，方便后续分发和检索。",
      tone: "publish",
    },
  ]);
});

test("buildPostWorkflowTasks returns empty when the article is structurally complete", () => {
  const tasks = buildPostWorkflowTasks(createInput());

  assert.deepEqual(tasks, []);
});
