import assert from "node:assert/strict";
import test from "node:test";
import { materializePostContent } from "./content-materializer";

test("materializePostContent creates stable heading ids and toc from all editor heading levels", async () => {
  const result = await materializePostContent({
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "文章结构" }],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "你好世界" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "第一段正文。" }],
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "你好世界" }],
      },
      {
        type: "heading",
        attrs: { level: 4 },
        content: [{ type: "text", text: "细节" }],
      },
    ],
  });

  assert.deepEqual(result.contentToc, [
    { id: "wen-zhang-jie-gou", title: "文章结构", level: 1 },
    { id: "ni-hao-shi-jie", title: "你好世界", level: 2 },
    { id: "ni-hao-shi-jie-1", title: "你好世界", level: 3 },
    { id: "xi-jie", title: "细节", level: 4 },
  ]);
  assert.match(result.contentHtml, /id="wen-zhang-jie-gou"/);
  assert.match(result.contentHtml, /id="ni-hao-shi-jie"/);
  assert.match(result.contentHtml, /id="ni-hao-shi-jie-1"/);
  assert.match(result.contentHtml, /id="xi-jie"/);
});

test("materializePostContent derives text and reading metadata from the same json source", async () => {
  const result = await materializePostContent({
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "标题" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Alpha beta gamma." }],
      },
    ],
  });

  assert.equal(result.contentText, "标题\n\nAlpha beta gamma.");
  assert.equal(result.wordCount, 5);
  assert.equal(result.readingTimeMinutes, 1);
});
