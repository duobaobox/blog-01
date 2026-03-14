"use client";

import { useId, useRef, useState } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import type { ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

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
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}

export function PostRichEditor({
  initialJson,
  initialMarkdown,
  placeholder = "从一句清晰的开头开始。",
  onChange,
}: PostRichEditorProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
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
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
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
          "tiptap min-h-[60svh] text-[15px] leading-8 text-foreground focus:outline-none",
      },
    },
    onCreate: ({ editor }) => emitSnapshot(editor),
    onUpdate: ({ editor }) => emitSnapshot(editor),
  });

  function handleSetLink() {
    if (!instance) return;

    const previousUrl =
      typeof instance.getAttributes("link").href === "string"
        ? String(instance.getAttributes("link").href)
        : "";
    const url = window.prompt(
      "输入链接地址，留空则移除当前链接。",
      previousUrl || "https://",
    );

    if (url === null) return;

    if (!url.trim()) {
      instance.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    if (instance.state.selection.empty) {
      window.alert("请先选中一段文字，再设置链接。");
      return;
    }

    instance
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: normalizeUrl(url.trim()) })
      .run();
  }

  async function handleUploadImage(file: File) {
    if (!instance) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "上传失败");
      }

      instance
        .chain()
        .focus()
        .setImage({
          src: data.url,
          alt: file.name,
          title: file.name,
        })
        .run();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "图片上传失败，请稍后重试。";
      window.alert(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border bg-card/40">
      <div className="flex flex-wrap items-center gap-1 border-b px-3 py-2">
        <ToolbarButton
          label="二级标题"
          active={instance?.isActive("heading", { level: 2 })}
          disabled={!instance}
          onClick={() =>
            instance?.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="三级标题"
          active={instance?.isActive("heading", { level: 3 })}
          disabled={!instance}
          onClick={() =>
            instance?.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="加粗"
          active={instance?.isActive("bold")}
          disabled={!instance}
          onClick={() => instance?.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="斜体"
          active={instance?.isActive("italic")}
          disabled={!instance}
          onClick={() => instance?.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="删除线"
          active={instance?.isActive("strike")}
          disabled={!instance}
          onClick={() => instance?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="无序列表"
          active={instance?.isActive("bulletList")}
          disabled={!instance}
          onClick={() => instance?.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="有序列表"
          active={instance?.isActive("orderedList")}
          disabled={!instance}
          onClick={() => instance?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="引用"
          active={instance?.isActive("blockquote")}
          disabled={!instance}
          onClick={() => instance?.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="代码块"
          active={instance?.isActive("codeBlock")}
          disabled={!instance}
          onClick={() => instance?.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="链接"
          active={instance?.isActive("link")}
          disabled={!instance}
          onClick={handleSetLink}
        >
          <Link2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="上传图片"
          disabled={!instance || uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
        </ToolbarButton>
        <div className="ml-auto flex items-center gap-1">
          {uploading ? (
            <span className="mr-2 text-xs text-muted-foreground">上传中...</span>
          ) : null}
          <ToolbarButton
            label="撤销"
            disabled={!instance?.can().chain().focus().undo().run()}
            onClick={() => instance?.chain().focus().undo().run()}
          >
            <Undo2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="重做"
            disabled={!instance?.can().chain().focus().redo().run()}
            onClick={() => instance?.chain().focus().redo().run()}
          >
            <Redo2 className="size-4" />
          </ToolbarButton>
        </div>
      </div>

      <label htmlFor={inputId} className="sr-only">
        上传图片
      </label>
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";

          if (!file) return;
          await handleUploadImage(file);
        }}
      />

      <div className="px-8 py-6">
        <EditorContent editor={instance} />
      </div>
    </div>
  );
}
