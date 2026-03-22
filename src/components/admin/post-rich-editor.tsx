"use client";

import { useRef, useState, useEffect } from "react";
import { Extension, type Editor, type JSONContent } from "@tiptap/core";
import type { ReactNode } from "react";
import { Plugin } from "@tiptap/pm/state";
import { EditorContent, useEditor } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Type,
  Undo2,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { MediaPickerDialog } from "@/features/media/components/media-picker-dialog";
import type { MediaItem } from "@/features/media/types/storage.types";

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

type EditorSnapshot = {
  json: string;
  markdown: string;
  text: string;
};

type PostRichEditorProps = {
  initialJson: string;
  initialMarkdown: string;
  placeholder?: string;
  onChange: (snapshot: EditorSnapshot) => void;
  onEditorReady?: (editor: Editor | null) => void;
};

function resolveInitialContent(initialJson: string, initialMarkdown: string) {
  if (initialJson.trim()) {
    try {
      return {
        content: JSON.parse(initialJson) as JSONContent,
        contentType: "json" as const,
      };
    } catch {
      // Fall back to markdown if an older record contains malformed JSON.
    }
  }

  if (initialMarkdown.trim()) {
    return {
      content: initialMarkdown,
      contentType: "markdown" as const,
    };
  }

  return {
    content: EMPTY_DOC,
    contentType: "json" as const,
  };
}

function normalizeUrl(value: string) {
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("#")
  ) {
    return value;
  }

  return `https://${value}`;
}

const PLAIN_TEXT_NODE_TYPES = new Set(["doc", "paragraph", "text"]);
const MARKDOWN_HINT_PATTERNS = [
  /^(#{1,6})\s+\S+/m,
  /^>\s+\S+/m,
  /^(?:[-*+]\s|\d+\.\s)\S+/m,
  /^```[\s\S]*```$/m,
  /^(?:---|\*\*\*|___)\s*$/m,
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

const MarkdownPaste = Extension.create({
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

type ToolbarButtonProps = {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
};

function ToolbarButton({
  active = false,
  disabled = false,
  label,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "secondary" : "ghost"}
      className={cn("h-8 px-2", active && "bg-secondary")}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}

type EditorToolbarProps = {
  editor: Editor | null;
};

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const isParagraphActive = Boolean(
    editor?.isActive("paragraph") &&
      !editor?.isActive("heading") &&
      !editor?.isActive("bulletList") &&
      !editor?.isActive("orderedList") &&
      !editor?.isActive("blockquote") &&
      !editor?.isActive("codeBlock"),
  );

  function handleSetLink() {
    if (!editor) return;

    const previousUrl =
      typeof editor.getAttributes("link").href === "string"
        ? String(editor.getAttributes("link").href)
        : "";
    const url = window.prompt(
      "输入链接地址，留空则移除当前链接。",
      previousUrl || "https://",
    );

    if (url === null) return;

    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    if (editor.state.selection.empty) {
      window.alert("请先选中一段文字，再设置链接。");
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: normalizeUrl(url.trim()) })
      .run();
  }

  function handleMediaSelect(media: MediaItem) {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .setImage({
        src: media.url,
        alt: media.alt || media.filename,
        title: media.filename,
      })
      .run();
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b bg-background/95 px-3 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ToolbarButton
          label="撤销"
          disabled={!editor?.can().chain().focus().undo().run()}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="重做"
          disabled={!editor?.can().chain().focus().redo().run()}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton
          label="正文"
          active={isParagraphActive}
          disabled={!editor}
          onClick={() =>
            editor?.chain().focus().clearNodes().setParagraph().run()
          }
        >
          <Type className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="一级标题"
          active={editor?.isActive("heading", { level: 1 })}
          disabled={!editor}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="二级标题"
          active={editor?.isActive("heading", { level: 2 })}
          disabled={!editor}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="三级标题"
          active={editor?.isActive("heading", { level: 3 })}
          disabled={!editor}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="size-4" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton
          label="加粗"
          active={editor?.isActive("bold")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="斜体"
          active={editor?.isActive("italic")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="删除线"
          active={editor?.isActive("strike")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="行内代码"
          active={editor?.isActive("code")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          <Code className="size-4" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton
          label="无序列表"
          active={editor?.isActive("bulletList")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="有序列表"
          active={editor?.isActive("orderedList")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="引用"
          active={editor?.isActive("blockquote")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="代码块"
          active={editor?.isActive("codeBlock")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="分隔线"
          disabled={!editor}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="size-4" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton
          label="链接"
          active={editor?.isActive("link")}
          disabled={!editor}
          onClick={handleSetLink}
        >
          <Link2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="插入图片"
          disabled={!editor}
          onClick={() => setPickerOpen(true)}
        >
          <ImagePlus className="size-4" />
        </ToolbarButton>
      </div>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleMediaSelect}
        mimeTypePrefix="image"
      />
    </>
  );
}

export function PostRichEditor({
  initialJson,
  initialMarkdown,
  placeholder = "从一句清晰的开头开始。",
  onChange,
  onEditorReady,
}: PostRichEditorProps) {
  const lastEmittedRef = useRef<{
    json: string;
    markdown: string;
  } | null>(null);
  const { content, contentType } = resolveInitialContent(
    initialJson,
    initialMarkdown,
  );

  function emitSnapshot(editor: Editor) {
    onChange({
      json: JSON.stringify(editor.getJSON()),
      markdown: editor.getMarkdown(),
      text: editor.getText(),
    });
  }

  const instance = useEditor({
    immediatelyRender: false,
    extensions: [
      MarkdownPaste,
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Image.configure({
        allowBase64: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Markdown,
    ],
    content,
    contentType,
    editorProps: {
      attributes: {
        class:
          "tiptap prose prose-neutral dark:prose-invert max-w-none min-h-[60svh] focus:outline-none",
      },
    },
    onCreate: ({ editor }) => {
      lastEmittedRef.current = {
        json: JSON.stringify(editor.getJSON()),
        markdown: editor.getMarkdown(),
      };
      onEditorReady?.(editor);
    },
    onUpdate: ({ editor }) => {
      lastEmittedRef.current = {
        json: JSON.stringify(editor.getJSON()),
        markdown: editor.getMarkdown(),
      };
      emitSnapshot(editor);
    },
    onDestroy: () => onEditorReady?.(null),
  });

  useEffect(() => {
    if (!instance) return;

    const lastEmitted = lastEmittedRef.current;
    if (
      lastEmitted?.json === initialJson &&
      lastEmitted?.markdown === initialMarkdown
    ) {
      return;
    }

    const next = resolveInitialContent(initialJson, initialMarkdown);

    instance.commands.setContent(next.content, {
      contentType: next.contentType,
      emitUpdate: false,
    });

    lastEmittedRef.current = {
      json: JSON.stringify(instance.getJSON()),
      markdown: instance.getMarkdown(),
    };
  }, [instance, initialJson, initialMarkdown]);

  useEffect(() => {
    onEditorReady?.(instance ?? null);
  }, [instance, onEditorReady]);

  return (
    <div className="mt-8">
      <EditorContent editor={instance} />
    </div>
  );
}
