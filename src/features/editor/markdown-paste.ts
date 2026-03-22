import { Extension, type JSONContent } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

const PLAIN_TEXT_NODE_TYPES = new Set(["doc", "paragraph", "text"]);
const MARKDOWN_HINT_PATTERNS = [
  /^(#{1,6})\s+\S+/m,
  /^>\s+\S+/m,
  /^(?:[-*+]\s|\d+\.\s)\S+/m,
  /^(?:[-*+]\s+\[[ xX]\]\s+)\S+/m,
  /^```[\s\S]*```$/m,
  /^(?:---|\*\*\*|___)\s*$/m,
  /^\|(?:.+\|)+\s*$/m,
  /!\[[^\]]*]\([^)]+\)/,
  /\[[^\]]+]\([^)]+\)/,
  /(^|[^`])`[^`\n]+`(?!`)/,
  /(^|[^*])\*\*[^*\n]+\*\*(?!\*)/,
  /(^|[^~])~~[^~\n]+~~(?!~)/,
];

function looksLikeMarkdown(text: string) {
  const normalized = text.trim();

  if (!normalized) {
    return false;
  }

  return MARKDOWN_HINT_PATTERNS.some((pattern) => pattern.test(normalized));
}

function containsRichMarkdown(node: JSONContent | undefined | null): boolean {
  if (!node) {
    return false;
  }

  if (node.marks?.length) {
    return true;
  }

  if (node.type && !PLAIN_TEXT_NODE_TYPES.has(node.type)) {
    return true;
  }

  return node.content?.some((child) => containsRichMarkdown(child)) ?? false;
}

export const MarkdownPaste = Extension.create({
  name: "markdownPaste",
  priority: 1000,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (_view, event) => {
            const clipboard = event.clipboardData;

            if (!clipboard || clipboard.files.length > 0) {
              return false;
            }

            const markdownText = clipboard.getData("text/markdown");
            const plainText = clipboard.getData("text/plain");
            const candidate = markdownText || plainText;

            if (!candidate.trim()) {
              return false;
            }

            if (!markdownText && !looksLikeMarkdown(candidate)) {
              return false;
            }

            const parsed = this.editor.markdown?.parse(candidate);
            if (!markdownText && !containsRichMarkdown(parsed)) {
              return false;
            }

            const inserted = this.editor.commands.insertContent(candidate, {
              contentType: "markdown",
            });

            if (!inserted) {
              return false;
            }

            event.preventDefault();
            return true;
          },
        },
      }),
    ];
  },
});
