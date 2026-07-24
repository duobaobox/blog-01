import assert from "node:assert/strict";
import test from "node:test";
import { ValidationError } from "@/shared/lib/app-error";
import { parsePostWriteFormData } from "./post-write";

function createBaseFormData(status = "draft") {
  const formData = new FormData();
  formData.set("status", status);
  formData.set("folderId", "folder-1");
  return formData;
}

test("parsePostWriteFormData normalizes optional fields", () => {
  const formData = createBaseFormData("published");
  formData.set("title", "  Hello World  ");
  formData.set("contentJson", "");
  formData.set("coverImageUrl", "  /media/demo.jpg  ");
  formData.set("categoryId", "  cat-1 ");
  formData.set("folderId", " folder-1 ");
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
    folderId: "folder-1",
    status: "published",
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: "https://example.com/post",
    isFeatured: true,
    tagIds: ["tag-1"],
    saveIntent: "manual",
  });
});

test("parsePostWriteFormData rejects posts without a folder", () => {
  const formData = new FormData();
  formData.set("status", "draft");

  assert.throws(() => parsePostWriteFormData(formData), ValidationError);
});

test("parsePostWriteFormData rejects a blank folder", () => {
  const formData = createBaseFormData();
  formData.set("folderId", "   ");

  assert.throws(() => parsePostWriteFormData(formData), ValidationError);
});

test("parsePostWriteFormData accepts a supported save intent", () => {
  const formData = createBaseFormData();
  formData.set("saveIntent", "autosave");

  assert.equal(parsePostWriteFormData(formData).saveIntent, "autosave");
});

test("parsePostWriteFormData falls back to manual for unknown save intents", () => {
  const formData = createBaseFormData();
  formData.set("saveIntent", "skip-audit");

  assert.equal(parsePostWriteFormData(formData).saveIntent, "manual");
});

test("parsePostWriteFormData accepts archived status", () => {
  const formData = createBaseFormData("archived");
  assert.equal(parsePostWriteFormData(formData).status, "archived");
});

test("parsePostWriteFormData rejects invalid status values", () => {
  const formData = createBaseFormData("invalid-status");
  assert.throws(() => parsePostWriteFormData(formData), ValidationError);
});

test("parsePostWriteFormData accepts review status", () => {
  const formData = createBaseFormData("review");
  assert.equal(parsePostWriteFormData(formData).status, "review");
});

test("parsePostWriteFormData rejects invalid canonical urls", () => {
  const formData = createBaseFormData();
  formData.set("canonicalUrl", "/relative/path");

  assert.throws(() => parsePostWriteFormData(formData), ValidationError);
});
