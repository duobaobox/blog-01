import assert from "node:assert/strict";
import test from "node:test";
import { ValidationError } from "@/shared/lib/app-error";
import { parsePostWriteFormData } from "./post-write";

test("parsePostWriteFormData normalizes optional fields and tag ids", () => {
  const formData = new FormData();
  formData.set("title", "  Hello World  ");
  formData.set("contentJson", "");
  formData.set("status", "published");
  formData.set("coverImageUrl", "  /media/demo.jpg  ");
  formData.set("categoryId", "  cat-1 ");
  formData.set("folderId", " ");
  formData.set("canonicalUrl", " https://example.com/post ");
  formData.set("isFeatured", "true");
  formData.append("tagIds", " tag-1 ");
  formData.append("tagIds", "tag-1");
  formData.append("tagIds", " ");

  assert.deepEqual(parsePostWriteFormData(formData), {
    title: "Hello World",
    slug: undefined,
    contentJson: {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
    excerpt: null,
    coverImageUrl: "/media/demo.jpg",
    categoryId: "cat-1",
    folderId: null,
    status: "published",
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: "https://example.com/post",
    isFeatured: true,
    tagIds: ["tag-1"],
  });
});

test("parsePostWriteFormData accepts archived status", () => {
  const formData = new FormData();
  formData.set("status", "archived");

  assert.equal(parsePostWriteFormData(formData).status, "archived");
});

test("parsePostWriteFormData rejects invalid status values", () => {
  const formData = new FormData();
  formData.set("status", "invalid-status");

  assert.throws(() => parsePostWriteFormData(formData), ValidationError);
});

test("parsePostWriteFormData accepts review status", () => {
  const formData = new FormData();
  formData.set("status", "review");

  assert.equal(parsePostWriteFormData(formData).status, "review");
});

test("parsePostWriteFormData rejects invalid canonical urls", () => {
  const formData = new FormData();
  formData.set("status", "draft");
  formData.set("canonicalUrl", "/relative/path");

  assert.throws(() => parsePostWriteFormData(formData), ValidationError);
});
