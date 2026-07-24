import assert from "node:assert/strict";
import test from "node:test";
import { ValidationError } from "@/shared/lib/app-error";
import {
  getPostPublishability,
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
