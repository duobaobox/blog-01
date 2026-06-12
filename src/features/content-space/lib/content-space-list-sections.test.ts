import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContentSpaceListSections,
  type ContentSpaceListSectionInput,
} from "./content-space-list-sections";

function createPosts() {
  return [
    {
      id: "post-1",
      title: "",
      status: "draft",
      updatedAt: "2026-06-13T11:00:00.000Z",
      subtopic: null,
      excerpt: null,
      coverImageUrl: null,
      seoTitle: null,
      seoDescription: null,
    },
    {
      id: "post-2",
      title: "一篇草稿",
      status: "draft",
      updatedAt: "2026-06-13T10:00:00.000Z",
      subtopic: null,
      excerpt: "",
      coverImageUrl: "https://example.com/cover.png",
      seoTitle: "SEO 标题",
      seoDescription: "SEO 描述",
    },
    {
      id: "post-3",
      title: "另一篇草稿",
      status: "draft",
      updatedAt: "2026-06-13T09:00:00.000Z",
      subtopic: null,
      excerpt: "已经有摘要",
      coverImageUrl: "https://example.com/cover-2.png",
      seoTitle: "SEO 标题 2",
      seoDescription: "SEO 描述 2",
    },
  ];
}

test("buildContentSpaceListSections creates a single recent section", () => {
  const result = buildContentSpaceListSections({
    entry: "recent",
    posts: createPosts(),
  });

  assert.equal(result.length, 1);
  assert.equal(result[0]?.title, "继续写");
  assert.equal(result[0]?.posts.length, 3);
});

test("buildContentSpaceListSections groups drafts by actionability", () => {
  const result = buildContentSpaceListSections({
    entry: "drafts",
    posts: createPosts(),
  });

  assert.equal(result.length, 3);
  assert.equal(result[0]?.title, "待补标题");
  assert.equal(result[1]?.posts.length, 1);
  assert.equal(result[1]?.title, "待补摘要");
  assert.equal(result[2]?.title, "继续扩写");
});

test("buildContentSpaceListSections uses a focused review section for ready posts", () => {
  const result = buildContentSpaceListSections({
    entry: "ready",
    posts: [
      {
        ...createPosts()[0],
        title: "缺封面",
        excerpt: "有摘要",
      },
      {
        ...createPosts()[1],
        title: "缺 SEO",
        excerpt: "有摘要",
        coverImageUrl: "https://example.com/cover.png",
        seoTitle: "",
        seoDescription: "",
      },
      {
        ...createPosts()[2],
        title: "已齐全",
        excerpt: "有摘要",
      },
    ],
  });

  assert.equal(result.length, 3);
  assert.equal(result[0]?.title, "待补封面");
  assert.equal(result[1]?.title, "待补 SEO");
  assert.equal(result[2]?.title, "可以发布");
});

test("buildContentSpaceListSections summarizes topic view into draft and published lanes", () => {
  const result = buildContentSpaceListSections({
    entry: "topic",
    posts: [
      {
        ...createPosts()[1],
        status: "draft",
      },
      {
        ...createPosts()[2],
        id: "post-4",
        status: "published",
      },
    ],
  });

  assert.equal(result.length, 2);
  assert.equal(result[0]?.title, "待完善草稿");
  assert.equal(result[1]?.title, "已发布基线");
});
