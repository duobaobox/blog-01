import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import slugify from "slugify";
import { pinyin } from "pinyin-pro";
import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";

type HeadingIdState = {
  seenIds: Map<string, number>;
  fallbackIndex: number;
};

function generateHeadingBaseId(text: string): string {
  let slug = slugify(text, { lower: true, strict: true });
  if (!slug) {
    const py = pinyin(text, { toneType: "none", type: "array" }).join("-");
    slug = slugify(py, { lower: true, strict: true });
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

function rehypeHeadingIds() {
  return (tree: Root) => applyHeadingIds(tree);
}

function getTextContent(node: Element): string {
  let text = "";
  for (const child of node.children) {
    if (child.type === "text") {
      text += child.value;
    } else if (child.type === "element") {
      text += getTextContent(child);
    }
  }
  return text;
}

function applyHeadingIds(tree: Root) {
  const state: HeadingIdState = {
    seenIds: new Map(),
    fallbackIndex: 0,
  };

  visit(tree, "element", (node: Element) => {
    if (!["h1", "h2", "h3", "h4", "h5", "h6"].includes(node.tagName)) {
      return;
    }

    const text = getTextContent(node).trim();
    if (!text) {
      return;
    }

    node.properties = node.properties || {};
    node.properties.id = generateHeadingId(text, state);
  });
}

function buildMarkdownTree(markdown: string): Root {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype);

  return processor.runSync(processor.parse(markdown)) as Root;
}

const sanitizeSchema = {
  ...defaultSchema,
  clobberPrefix: "",
  attributes: {
    ...defaultSchema.attributes,
    h1: [...(defaultSchema.attributes?.h1 || []), "id"],
    h2: [...(defaultSchema.attributes?.h2 || []), "id"],
    h3: [...(defaultSchema.attributes?.h3 || []), "id"],
    h4: [...(defaultSchema.attributes?.h4 || []), "id"],
    h5: [...(defaultSchema.attributes?.h5 || []), "id"],
    h6: [...(defaultSchema.attributes?.h6 || []), "id"],
  },
};

export async function renderMarkdown(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeHeadingIds)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypePrettyCode, { theme: "github-dark" })
    .use(rehypeStringify)
    .process(markdown);

  return String(result);
}

export interface TocItem {
  id: string;
  title: string;
  level: number;
}

export function extractToc(markdown: string): TocItem[] {
  const toc: TocItem[] = [];
  const tree = buildMarkdownTree(markdown);

  applyHeadingIds(tree);

  visit(tree, "element", (node: Element) => {
    if (!["h2", "h3"].includes(node.tagName)) {
      return;
    }

    const title = getTextContent(node).trim();
    const id =
      typeof node.properties?.id === "string" ? node.properties.id : null;

    if (!title || !id) {
      return;
    }

    toc.push({
      id,
      title,
      level: Number(node.tagName.slice(1)),
    });
  });

  return toc;
}
