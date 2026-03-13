import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypePrettyCode from "rehype-pretty-code";
import slugify from "slugify";
import { pinyin } from "pinyin-pro";

type MarkdownNode = {
  type?: string;
  depth?: number;
  value?: string;
  children?: MarkdownNode[];
  data?: {
    hProperties?: Record<string, string>;
  };
};

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    h1: [...(defaultSchema.attributes?.h1 ?? []), "id"],
    h2: [...(defaultSchema.attributes?.h2 ?? []), "id"],
    h3: [...(defaultSchema.attributes?.h3 ?? []), "id"],
    h4: [...(defaultSchema.attributes?.h4 ?? []), "id"],
    h5: [...(defaultSchema.attributes?.h5 ?? []), "id"],
    h6: [...(defaultSchema.attributes?.h6 ?? []), "id"],
  },
};

function generateHeadingId(
  title: string,
  seenIds: Map<string, number>,
  fallbackIndex: number,
) {
  let id = slugify(title, { lower: true, strict: true });

  if (!id) {
    const pinyinText = pinyin(title, { toneType: "none", separator: "-" });
    id = slugify(pinyinText, { lower: true, strict: true });
  }

  if (!id) {
    id = `heading-${fallbackIndex}`;
  }

  if (seenIds.has(id)) {
    const count = seenIds.get(id)! + 1;
    seenIds.set(id, count);
    return `${id}-${count}`;
  }

  seenIds.set(id, 0);
  return id;
}

function getNodeText(node: MarkdownNode): string {
  if (typeof node.value === "string") {
    return node.value;
  }

  if (!Array.isArray(node.children)) {
    return "";
  }

  return node.children.map((child) => getNodeText(child)).join("");
}

function visitNodes(node: MarkdownNode, visitor: (node: MarkdownNode) => void) {
  visitor(node);

  if (!Array.isArray(node.children)) {
    return;
  }

  node.children.forEach((child) => visitNodes(child, visitor));
}

function withHeadingIds() {
  return (tree: MarkdownNode) => {
    const seenIds = new Map<string, number>();
    let fallbackIndex = 0;

    visitNodes(tree, (node) => {
      if (
        node.type !== "heading" ||
        typeof node.depth !== "number" ||
        node.depth < 1 ||
        node.depth > 6
      ) {
        return;
      }

      const title = getNodeText(node).trim();
      if (!title) {
        return;
      }

      const id = generateHeadingId(title, seenIds, fallbackIndex);
      fallbackIndex += 1;

      node.data = {
        ...node.data,
        hProperties: {
          ...node.data?.hProperties,
          id,
        },
      };
    });
  };
}

export async function renderMarkdown(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(withHeadingIds)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypePrettyCode, { theme: "github-dark" })
    .use(rehypeStringify)
    .process(markdown);

  return String(result);
}

interface TocItem {
  id: string;
  title: string;
  level: number;
}

export function extractToc(markdown: string): TocItem[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as MarkdownNode;
  const items: TocItem[] = [];
  const seenIds = new Map<string, number>();

  visitNodes(tree, (node) => {
    if (
      node.type !== "heading" ||
      typeof node.depth !== "number" ||
      node.depth < 2 ||
      node.depth > 3
    ) {
      return;
    }

    const title = getNodeText(node).trim();
    if (!title) {
      return;
    }

    const id = generateHeadingId(title, seenIds, items.length);
    items.push({ id, title, level: node.depth });
  });

  return items;
}
