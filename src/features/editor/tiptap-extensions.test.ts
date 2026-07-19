import assert from "node:assert/strict";
import test from "node:test";
import { generateText, type JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html/server";
import {
  createPostContentExtensions,
  createPostEditorExtensions,
} from "@/features/editor/tiptap-extensions";

const RICH_POST_CONTENT: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: {
        level: 2,
        id: "editor-contract",
        textAlign: "center",
        backgroundColor: "#fff3bf",
      },
      content: [
        {
          type: "text",
          text: "编辑器内容协议",
          marks: [
            { type: "underline" },
            { type: "highlight", attrs: { color: "#ffe066" } },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      attrs: {
        textAlign: "justify",
        backgroundColor: "#f8f9fa",
      },
      content: [
        { type: "text", text: "粗体", marks: [{ type: "bold" }] },
        { type: "text", text: "、" },
        { type: "text", text: "斜体", marks: [{ type: "italic" }] },
        { type: "text", text: "、" },
        { type: "text", text: "删除线", marks: [{ type: "strike" }] },
        { type: "text", text: "、" },
        { type: "text", text: "代码", marks: [{ type: "code" }] },
        { type: "text", text: "、" },
        { type: "text", text: "上标", marks: [{ type: "superscript" }] },
        { type: "text", text: "、" },
        { type: "text", text: "下标", marks: [{ type: "subscript" }] },
        { type: "text", text: "、" },
        {
          type: "text",
          text: "站内链接",
          marks: [{ type: "link", attrs: { href: "/posts/example" } }],
        },
        { type: "text", text: "、" },
        {
          type: "text",
          text: "标题锚点",
          marks: [{ type: "link", attrs: { href: "#editor-contract" } }],
        },
      ],
    },
    {
      type: "blockquote",
      attrs: { backgroundColor: "#e7f5ff" },
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "引用内容" }],
        },
      ],
    },
    {
      type: "bulletList",
      attrs: { backgroundColor: "#f3f0ff" },
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "无序列表" }],
            },
          ],
        },
      ],
    },
    {
      type: "orderedList",
      attrs: { start: 1, backgroundColor: "#fff9db" },
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "有序列表" }],
            },
          ],
        },
      ],
    },
    {
      type: "taskList",
      attrs: { backgroundColor: "#ebfbee" },
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "任务列表" }],
            },
          ],
        },
      ],
    },
    {
      type: "codeBlock",
      content: [{ type: "text", text: "const ready = true;" }],
    },
    { type: "horizontalRule" },
    {
      type: "image",
      attrs: {
        src: "https://example.com/editor-contract.png",
        alt: "示例图片",
        title: "内容协议图片",
      },
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableHeader",
              attrs: { backgroundColor: "#e9ecef" },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "表头" }],
                },
              ],
            },
            {
              type: "tableHeader",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "状态" }],
                },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          attrs: { rowHeight: 48 },
          content: [
            {
              type: "tableCell",
              attrs: { backgroundColor: "#f8f9fa" },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "正文" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "可用" }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

test("client editor extends the same persisted content contract", () => {
  const contentNames = createPostContentExtensions().map(
    (extension) => extension.name,
  );
  const editorNames = createPostEditorExtensions({
    placeholder: "开始写作",
  }).map((extension) => extension.name);

  assert.deepEqual(editorNames.slice(0, contentNames.length), contentNames);
  assert.equal(contentNames.includes("tableHandles"), false);
  assert.equal(editorNames.includes("tableHandles"), true);
  assert.equal(editorNames.at(-1), "placeholder");
});

test("server renderer supports every persisted rich-content feature", () => {
  const extensions = createPostContentExtensions();
  const html = generateHTML(RICH_POST_CONTENT, extensions);
  const text = generateText(RICH_POST_CONTENT, extensions, {
    blockSeparator: "\n\n",
  });

  assert.match(html, /<h2[^>]*id="editor-contract"/);
  assert.match(html, /text-align:\s*center/);
  assert.match(html, /background-color:\s*#fff3bf/);
  assert.match(html, /<mark[^>]*#ffe066/);
  assert.match(html, /<sup>上标<\/sup>/);
  assert.match(html, /<sub>下标<\/sub>/);
  assert.match(html, /href="\/posts\/example"/);
  assert.match(html, /href="#editor-contract"/);
  assert.match(html, /data-type="taskList"/);
  assert.match(html, /data-type="horizontalRule"/);
  assert.match(html, /<img[^>]*alt="示例图片"/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /decoding="async"/);
  assert.match(html, /class="tableWrapper"/);
  assert.match(html, /<table[^>]*class="tiptap-table"/);
  assert.match(html, /class="tiptap-table-header"/);
  assert.match(html, /class="tiptap-table-cell"/);
  assert.match(html, /data-row-height="48"/);
  assert.match(html, /height:\s*48px/);
  assert.match(html, /const ready = true;/);

  for (const expectedText of [
    "编辑器内容协议",
    "站内链接",
    "标题锚点",
    "任务列表",
    "表头",
    "可用",
  ]) {
    assert.ok(text.includes(expectedText), `missing text: ${expectedText}`);
  }
});
