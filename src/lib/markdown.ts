import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSanitize from "rehype-sanitize";
import rehypePrettyCode from "rehype-pretty-code";
import slugify from "slugify";
import { pinyin } from "pinyin-pro";

export async function renderMarkdown(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSanitize)
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
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  const seenIds = new Map<string, number>(); // Track duplicate IDs
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();

    // Generate ID with fallback for Chinese text
    let id = slugify(title, { lower: true, strict: true });

    // If slug is empty (pure Chinese), convert to pinyin first
    if (!id) {
      const pinyinText = pinyin(title, { toneType: "none", separator: "-" });
      id = slugify(pinyinText, { lower: true, strict: true });
    }

    // If still empty, use a fallback
    if (!id) {
      id = `heading-${items.length}`;
    }

    // Handle duplicate IDs
    if (seenIds.has(id)) {
      const count = seenIds.get(id)! + 1;
      seenIds.set(id, count);
      id = `${id}-${count}`;
    } else {
      seenIds.set(id, 0);
    }

    items.push({ id, title, level });
  }

  return items;
}
