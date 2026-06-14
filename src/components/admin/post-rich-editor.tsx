"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import type { ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Markdown } from "@tiptap/markdown";
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
  ListTodo,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Type,
  Undo2,
} from "lucide-react";
import {
  parseStoredContentJson,
  stringifyContentJson,
} from "@/features/editor/content-types";
import { MarkdownPaste } from "@/features/editor/markdown-paste";
import { createPostEditorExtensions } from "@/features/editor/tiptap-extensions";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { MediaPickerDialog } from "@/features/media/components/media-picker-dialog";
import type { MediaItem } from "@/features/media/types/storage.types";

type EditorSnapshot = {
  json: string;
  text: string;
};

type PostRichEditorProps = {
  initialJson: string;
  placeholder?: string;
  onChange: (snapshot: EditorSnapshot) => void;
  onEditorReady?: (editor: Editor | null) => void;
};

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
      <div className="flex shrink-0 items-center justify-center gap-1 overflow-x-auto border-b bg-background/95 px-3 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          label="任务列表"
          active={editor?.isActive("taskList")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleTaskList().run()}
        >
          <ListTodo className="size-4" />
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
        <ToolbarButton
          label="插入表格"
          active={editor?.isActive("table")}
          disabled={!editor}
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <Table2 className="size-4" />
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
  placeholder = "从一句清晰的开头开始。",
  onChange,
  onEditorReady,
}: PostRichEditorProps) {
  const lastEmittedRef = useRef<string | null>(null);
  const normalizedInitialJson = stringifyContentJson(
    parseStoredContentJson(initialJson),
  );
  const extensions = useMemo(
    () => [MarkdownPaste, ...createPostEditorExtensions({ placeholder }), Markdown],
    [placeholder],
  );

  function emitSnapshot(editor: Editor) {
    onChange({
      json: stringifyContentJson(editor.getJSON()),
      text: editor.getText(),
    });
  }

  const instance = useEditor({
    immediatelyRender: false,
    extensions,
    content: parseStoredContentJson(normalizedInitialJson),
    editorProps: {
      attributes: {
        class:
          "editor-prose editor-prose-editable tiptap prose prose-neutral dark:prose-invert max-w-none min-h-[60svh] focus:outline-none",
      },
    },
    onCreate: ({ editor }) => {
      lastEmittedRef.current = stringifyContentJson(editor.getJSON());
      onEditorReady?.(editor);
    },
    onUpdate: ({ editor }) => {
      lastEmittedRef.current = stringifyContentJson(editor.getJSON());
      emitSnapshot(editor);
    },
    onDestroy: () => onEditorReady?.(null),
  });

  useEffect(() => {
    if (!instance) return;

    if (lastEmittedRef.current === normalizedInitialJson) {
      return;
    }

    instance.commands.setContent(parseStoredContentJson(normalizedInitialJson), {
      emitUpdate: false,
    });

    lastEmittedRef.current = stringifyContentJson(instance.getJSON());
  }, [instance, normalizedInitialJson]);

  useEffect(() => {
    onEditorReady?.(instance ?? null);
  }, [instance, onEditorReady]);

  return (
    <div className="mt-8">
      <EditorContent editor={instance} />
    </div>
  );
}
