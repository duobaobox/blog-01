import assert from "node:assert/strict";
import test from "node:test";
import { ValidationError } from "@/shared/lib/app-error";
import {
  countReadyToPublishPosts,
  getPostPublishability,
  isReadyToPublishPost,
  requirePublishablePost,
} from "./post-publishability";

test("getPostPublishability rejects empty titles and empty content", () => {
  assert.deepEqual(
    getPostPublishability({
      title: " ",
      contentJson: { type: "doc", content: [{ type: "paragraph" }] },
    }),
    {
      canPublish: false,
      reasons: [
        "请先填写一个明确的文章标题",
        "请先补充正文内容后再发布",
      ],
    },
  );
});

test("getPostPublishability accepts posts with a meaningful title and content", () => {
  assert.deepEqual(
    getPostPublishability({
      title: "Growth Loop",
      contentJson: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "hello world" }],
          },
        ],
      },
    }),
    {
      canPublish: true,
      reasons: [],
    },
  );
});

test("isReadyToPublishPost reuses publishability rules for stored draft summaries", () => {
  assert.equal(
    isReadyToPublishPost({
      status: "review",
      title: "Growth Loop",
      contentText: "",
    }),
    true,
  );
  assert.equal(
    isReadyToPublishPost({
      status: "draft",
      title: "Growth Loop",
      contentText: "hello world",
    }),
    true,
  );
  assert.equal(
    isReadyToPublishPost({
      status: "draft",
      title: "未命名 1",
      contentText: "hello world",
    }),
    false,
  );
  assert.equal(
    isReadyToPublishPost({
      status: "published",
      title: "Growth Loop",
      contentText: "hello world",
    }),
    false,
  );
});

test("requirePublishablePost throws a validation error when the post cannot be published", () => {
  assert.throws(
    () =>
      requirePublishablePost({
        title: " ",
        contentJson: { type: "doc", content: [{ type: "paragraph" }] },
      }),
    ValidationError,
  );
});

test("countReadyToPublishPosts counts review posts and publishable drafts", () => {
  assert.equal(
    countReadyToPublishPosts([
      {
        status: "review",
        title: "Ready A",
        contentText: "",
      },
      {
        status: "draft",
        title: "Ready B",
        contentText: "hello world",
      },
      {
        status: "draft",
        title: " ",
        contentText: "hello world",
      },
      {
        status: "published",
        title: "Published",
        contentText: "hello world",
      },
    ]),
    2,
  );
});
