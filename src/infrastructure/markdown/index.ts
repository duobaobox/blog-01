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

function generateHeadingId(text: string): string {
  let slug = slugify(text, { lower: true, strict: true });
  if (!slug) {
    const py = pinyin(text, { toneType: "none", type: "array" }).join("-");
    slug = slugify(py, { lower: true, strict: true });
  }
  return slug || `heading-${Date.now()}`;
}

function rehypeHeadingIds() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(node.tagName)) {
        const text = getTextContent(node);
        node.properties = node.properties || {};
        node.properties.id = generateHeadingId(text);
      }
    });
  };
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

const sanitizeSchema = {
  ...defaultSchema,
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
    .use(rehypeHeadingIds)
    .use(remarkRehype)
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
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const toc: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    const id = generateHeadingId(title);
    toc.push({ id, title, level });
  }

  return toc;
}
