import "server-only";

import { generateText, type JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html/server";
import readingTime from "reading-time";
import { pinyin } from "pinyin-pro";
import rehypeParse from "rehype-parse";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import slugify from "slugify";
import { unified } from "unified";
import {
  cloneContentJson,
  normalizeContentJson,
  type TocItem,
} from "@/features/editor/content-types";
import { createPostContentExtensions } from "@/features/editor/tiptap-extensions";

type HeadingIdState = {
  seenIds: Map<string, number>;
  fallbackIndex: number;
};

export type MaterializedPostContent = {
  contentJson: JSONContent;
  contentHtml: string;
  contentText: string;
  contentToc: TocItem[];
  wordCount: number;
  readingTimeMinutes: number;
};

function getNodeText(node: JSONContent | undefined | null): string {
  if (!node) {
    return "";
  }

  if (node.type === "text") {
    return node.text ?? "";
  }

  return node.content?.map((child) => getNodeText(child)).join("") ?? "";
}

function generateHeadingBaseId(text: string): string {
  let slug = slugify(text, { lower: true, strict: true, trim: true });

  if (!slug) {
    const py = pinyin(text, { toneType: "none", type: "array" }).join("-");
    slug = slugify(py, { lower: true, strict: true, trim: true });
  }

  return slug;
}

function generateHeadingId(text: string, state: HeadingIdState): string {
  const baseId =
    generateHeadingBaseId(text) || `heading-${state.fallbackIndex++}`;
  const seenCount = state.seenIds.get(baseId);

  if (seenCount === undefined) {
    state.seenIds.set(baseId, 0);
    return baseId;
  }

  const nextCount = seenCount + 1;
  state.seenIds.set(baseId, nextCount);
  return `${baseId}-${nextCount}`;
}

function isSupportedTocLevel(level: number | null): level is number {
  return level !== null && Number.isInteger(level) && level >= 1 && level <= 4;
}

function applyHeadingIds(
  node: JSONContent | null | undefined,
  state: HeadingIdState,
  toc: TocItem[],
) {
  if (!node) {
    return;
  }

  if (node.type === "heading") {
    const title = getNodeText(node).trim();
    const level =
      typeof node.attrs?.level === "number" ? node.attrs.level : null;

    if (title) {
      const id = generateHeadingId(title, state);
      node.attrs = { ...(node.attrs ?? {}), id };

      if (isSupportedTocLevel(level)) {
        toc.push({ id, title, level });
      }
    }
  }

  node.content?.forEach((child) => applyHeadingIds(child, state, toc));
}

function prepareHeadingOutline(value: unknown) {
  const contentJson = cloneContentJson(normalizeContentJson(value));
  const contentToc: TocItem[] = [];

  applyHeadingIds(
    contentJson,
    {
      seenIds: new Map(),
      fallbackIndex: 0,
    },
    contentToc,
  );

  return { contentJson, contentToc };
}

export function buildPostContentToc(value: unknown): TocItem[] {
  return prepareHeadingOutline(value).contentToc;
}

async function enhanceHtml(html: string) {
  const result = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypePrettyCode, { theme: "github-dark" })
    .use(rehypeStringify)
    .process(html);

  return String(result);
}

export async function materializePostContent(
  value: unknown,
): Promise<MaterializedPostContent> {
  const { contentJson, contentToc } = prepareHeadingOutline(value);
  const extensions = createPostContentExtensions();
  const contentHtml = await enhanceHtml(generateHTML(contentJson, extensions));
  const contentText = generateText(contentJson, extensions, {
    blockSeparator: "\n\n",
  })
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const stats = readingTime(contentText);
  const wordCount = stats.words;
  const readingTimeMinutes =
    wordCount > 0 ? Math.max(1, Math.ceil(stats.minutes)) : 0;

  return {
    contentJson,
    contentHtml,
    contentText,
    contentToc,
    wordCount,
    readingTimeMinutes,
  };
}
