"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Editor, JSONContent } from "@tiptap/core"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"
import { Markdown } from "@tiptap/markdown"
import { Selection } from "@tiptap/extensions"
import { Table2 } from "lucide-react"

// --- UI Primitives ---
import { Button } from "@/components/tiptap/ui-primitive/button"
import { Spacer } from "@/components/tiptap/ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap/ui-primitive/toolbar"

// --- Tiptap Node Styles ---
import "@/components/tiptap/nodes/blockquote-node/blockquote-node.scss"
import "@/components/tiptap/nodes/code-block-node/code-block-node.scss"
import "@/components/tiptap/nodes/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap/nodes/list-node/list-node.scss"
import "@/components/tiptap/nodes/image-node/image-node.scss"
import "@/components/tiptap/nodes/heading-node/heading-node.scss"
import "@/components/tiptap/nodes/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap/ui/heading-dropdown-menu"
import { ListDropdownMenu } from "@/components/tiptap/ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap/ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap/ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap/ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap/ui/link-popover"
import { MarkButton } from "@/components/tiptap/ui/mark-button"
import { TextAlignButton } from "@/components/tiptap/ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap/ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap/icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap/icons/highlighter-icon"
import { ImagePlusIcon } from "@/components/tiptap/icons/image-plus-icon"
import { LinkIcon } from "@/components/tiptap/icons/link-icon"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Editor Extensions ---
import { MarkdownPaste } from "@/features/editor/markdown-paste"
import { createPostEditorExtensions } from "@/features/editor/tiptap-extensions"

// --- Styles ---
import "@/components/tiptap/templates/simple/simple-editor.scss"

const EMPTY_CONTENT: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
}

export type SimpleEditorUpdate = {
  json: JSONContent
  text: string
}

export type SimpleEditorProps = {
  initialContent?: JSONContent | null
  contentKey?: string
  placeholder?: string
  onUpdate?: (snapshot: SimpleEditorUpdate) => void
  onEditorReady?: (editor: Editor | null) => void
  onRequestMedia?: () => void
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  onMediaClick,
  onInsertTable,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  onMediaClick: () => void
  onInsertTable: () => void
  isMobile: boolean
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu
          modal={false}
          types={["bulletList", "orderedList", "taskList"]}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <Button
          variant="ghost"
          onClick={onMediaClick}
          aria-label="从媒体库插入图片"
          tooltip="从媒体库插入图片"
        >
          <ImagePlusIcon className="tiptap-button-icon" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onInsertTable}
          aria-label="插入表格"
          tooltip="插入表格"
        >
          <Table2 className="tiptap-button-icon" />
        </Button>
      </ToolbarGroup>

      <Spacer />
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export function SimpleEditor(props: SimpleEditorProps) {
  return (
    <SimpleEditorInstance
      key={props.contentKey ?? "default-editor-content"}
      {...props}
    />
  )
}

function SimpleEditorInstance({
  initialContent,
  placeholder = "从一句清晰的开头开始。",
  onUpdate,
  onEditorReady,
  onRequestMedia,
}: SimpleEditorProps) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [contentRef] = useState<JSONContent>(
    () => initialContent ?? EMPTY_CONTENT,
  )
  const onUpdateRef = useRef(onUpdate)
  const onEditorReadyRef = useRef(onEditorReady)
  const extensions = useMemo(
    () => [
      ...createPostEditorExtensions({ placeholder }),
      MarkdownPaste,
      Markdown,
      Selection,
    ],
    [placeholder],
  )

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    onEditorReadyRef.current = onEditorReady
  }, [onEditorReady])

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions,
    content: contentRef,
    onCreate: ({ editor }) => onEditorReadyRef.current?.(editor),
    onUpdate: ({ editor }) =>
      onUpdateRef.current?.({ json: editor.getJSON(), text: editor.getText() }),
    onDestroy: () => onEditorReadyRef.current?.(null),
  })

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              onMediaClick={() => onRequestMedia?.()}
              onInsertTable={() =>
                editor
                  ?.chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  )
}
