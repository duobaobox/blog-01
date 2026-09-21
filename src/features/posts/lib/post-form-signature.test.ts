import assert from "node:assert/strict";
import test from "node:test";
import {
  arePostFormSignaturesEqual,
  createPostFormSignature,
  isPostFormDirty,
  type PostFormSignatureInput,
} from "./post-form-signature";

function createForm(
  overrides: Partial<PostFormSignatureInput> = {},
): PostFormSignatureInput {
  return {
    title: "标题",
    excerpt: "摘要",
    coverImageUrl: "",
    contentJson: '{"type":"doc","content":[]}',
    categoryId: "",
    folderId: "folder-1",
    selectedTagIds: ["tag-a", "tag-b"],
    isFeatured: false,
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
    status: "draft",
    ...overrides,
  };
}

test("同一份表单内容不视为有改动", () => {
  const form = createForm();

  assert.equal(isPostFormDirty(form, createPostFormSignature(form)), false);
  assert.equal(
    isPostFormDirty(createForm(), createPostFormSignature(createForm())),
    false,
  );
});

test("标签顺序不同不算改动（与排序快照的语义一致）", () => {
  const baseline = createPostFormSignature(
    createForm({ selectedTagIds: ["tag-b", "tag-a"] }),
  );

  assert.equal(
    isPostFormDirty(createForm({ selectedTagIds: ["tag-a", "tag-b"] }), baseline),
    false,
  );
});

test("标签增删算改动", () => {
  const baseline = createPostFormSignature(createForm());

  assert.equal(
    isPostFormDirty(createForm({ selectedTagIds: ["tag-a"] }), baseline),
    true,
  );
  assert.equal(
    isPostFormDirty(
      createForm({ selectedTagIds: ["tag-a", "tag-b", "tag-c"] }),
      baseline,
    ),
    true,
  );
});

test("每个参与检测的字段单独变化都会判定为改动", () => {
  const baseline = createPostFormSignature(createForm());

  const changedFields: Array<Partial<PostFormSignatureInput>> = [
    { title: "新标题" },
    { excerpt: "新摘要" },
    { coverImageUrl: "/media/cover.png" },
    { contentJson: '{"type":"doc","content":[{"type":"paragraph"}]}' },
    { categoryId: "cat-1" },
    { folderId: "folder-2" },
    { selectedTagIds: ["tag-a"] },
    { isFeatured: true },
    { seoTitle: "SEO 标题" },
    { seoDescription: "SEO 描述" },
    { canonicalUrl: "https://example.com/post" },
    { status: "published" },
  ];

  for (const change of changedFields) {
    assert.equal(
      isPostFormDirty(createForm(change), baseline),
      true,
      `${Object.keys(change)[0]} 变化应判定为改动`,
    );
  }
});

test("正文派生字段不参与检测，单独变化不触发保存判定", () => {
  const baseline = createPostFormSignature(createForm());
  const withDerivedOnlyChange = {
    ...createForm(),
    // 这些字段由正文派生，编辑器每次输入都会更新，但不属于需要保存的修改。
    contentText: "正文纯文本",
    wordCount: 120,
    readingMinutes: 1,
  } as PostFormSignatureInput;

  assert.equal(isPostFormDirty(withDerivedOnlyChange, baseline), false);
});

test("签名是快照：基线不随后续表单对象变化而变化", () => {
  const tagIds = ["tag-a"];
  const baseline = createPostFormSignature(
    createForm({ selectedTagIds: tagIds }),
  );

  // 调用方继续改写同一个数组引用时，基线应保持创建时的内容。
  tagIds.push("tag-b");

  assert.deepEqual(baseline.selectedTagIds, ["tag-a"]);
  assert.equal(
    isPostFormDirty(createForm({ selectedTagIds: ["tag-a"] }), baseline),
    false,
  );
  assert.equal(
    isPostFormDirty(createForm({ selectedTagIds: ["tag-a", "tag-b"] }), baseline),
    true,
  );
});

test("签名相等本身是可复用的判定，不依赖创建顺序", () => {
  const left = createPostFormSignature(createForm({ isFeatured: true }));
  const right = createPostFormSignature(createForm({ isFeatured: true }));

  assert.equal(arePostFormSignaturesEqual(left, right), true);
  assert.equal(arePostFormSignaturesEqual(right, left), true);
});
