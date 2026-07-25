"use client"

import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"
import type { Editor } from "@tiptap/core"
import { Sparkles } from "lucide-react"
import {
  parseStoredContentJson,
  stringifyContentJson,
} from "@/features/editor/content-types"
import {
  SimpleEditor,
  type SimpleEditorSelection,
  type SimpleEditorUpdate,
} from "@/components/tiptap/templates/simple/simple-editor"
import { MediaPickerDialog } from "@/features/media/components/media-picker-dialog"
import type { MediaItem } from "@/features/media/types/storage.types"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"

export type EditorSnapshot = {
  json: string
  text: string
}

export type PostRichEditorProps = {
  initialJson: string
  contentKey?: string
  placeholder?: string
  onChange: (snapshot: EditorSnapshot) => void
  onEditorReady?: (editor: Editor | null) => void
}

type AiEditOperation =
  | "polish"
  | "simplify"
  | "expand"
  | "shorten"
  | "professional"
  | "conversational"
  | "custom"

type AiEditResult = {
  text: string
}

const AI_EDIT_OPERATIONS: Array<{
  value: AiEditOperation
  label: string
}> = [
  { value: "polish", label: "润色" },
  { value: "simplify", label: "简化" },
  { value: "expand", label: "扩写" },
  { value: "shorten", label: "缩写" },
  { value: "professional", label: "更专业" },
  { value: "conversational", label: "更口语" },
  { value: "custom", label: "自定义" },
]

const subscribeToHydration = () => () => {}

function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  )
}

export function PostRichEditor({
  initialJson,
  contentKey = "new-post",
  placeholder = "从一句清晰的开头开始。",
  onChange,
  onEditorReady,
}: PostRichEditorProps) {
  const hasHydrated = useHasHydrated()
  const [editor, setEditor] = useState<Editor | null>(null)
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [aiEditSelection, setAiEditSelection] =
    useState<SimpleEditorSelection | null>(null)
  const [aiEditDialogOpen, setAiEditDialogOpen] = useState(false)
  const [aiEditOperation, setAiEditOperation] =
    useState<AiEditOperation>("polish")
  const [aiEditInstruction, setAiEditInstruction] = useState("")
  const [aiEditLoading, setAiEditLoading] = useState(false)
  const [aiEditResult, setAiEditResult] = useState<AiEditResult | null>(null)
  const [aiEditError, setAiEditError] = useState<string | null>(null)

  const initialContent = useMemo(
    () => parseStoredContentJson(initialJson),
    [initialJson],
  )

  const handleEditorReady = useCallback(
    (nextEditor: Editor | null) => {
      setEditor(nextEditor)
      onEditorReady?.(nextEditor)
    },
    [onEditorReady],
  )

  const handleUpdate = useCallback(
    ({ json, text }: SimpleEditorUpdate) => {
      onChange({
        json: stringifyContentJson(json),
        text,
      })
    },
    [onChange],
  )

  const handleMediaSelect = useCallback(
    (media: MediaItem) => {
      editor
        ?.chain()
        .focus()
        .setImage({
          src: media.url,
          alt: media.alt || media.filename,
          title: media.filename,
        })
        .run()
    },
    [editor],
  )

  const handleOpenAiEdit = useCallback(
    (selection: SimpleEditorSelection | null) => {
      if (!selection) {
        setAiEditSelection(null)
        setAiEditResult(null)
        setAiEditError("请先在正文中选中一段文本。")
        setAiEditDialogOpen(true)
        return
      }

      setAiEditSelection(selection)
      setAiEditResult(null)
      setAiEditError(null)
      setAiEditInstruction("")
      setAiEditOperation("polish")
      setAiEditDialogOpen(true)
    },
    [],
  )

  const handleGenerateAiEdit = useCallback(async () => {
    if (!aiEditSelection) {
      setAiEditError("请先选中一段正文，再生成改写。")
      return
    }

    setAiEditLoading(true)
    setAiEditError(null)
    setAiEditResult(null)

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit-text",
          title: "",
          contentText: aiEditSelection.text,
          selectionText: aiEditSelection.text,
          operation: aiEditOperation,
          instruction: aiEditInstruction,
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { result?: AiEditResult; error?: string }
        | null

      if (!response.ok || !payload?.result?.text) {
        throw new Error(payload?.error || "AI 改写失败")
      }

      setAiEditResult(payload.result)
    } catch (error) {
      setAiEditError(
        error instanceof Error && error.message
          ? error.message
          : "AI 改写失败，请稍后重试。",
      )
    } finally {
      setAiEditLoading(false)
    }
  }, [aiEditInstruction, aiEditOperation, aiEditSelection])

  const handleApplyAiEdit = useCallback(() => {
    if (!editor || !aiEditSelection || !aiEditResult?.text) return

    editor
      .chain()
      .focus()
      .insertContentAt(
        { from: aiEditSelection.from, to: aiEditSelection.to },
        aiEditResult.text,
      )
      .run()

    setAiEditDialogOpen(false)
    setAiEditResult(null)
    setAiEditError(null)
  }, [aiEditResult, aiEditSelection, editor])

  if (!hasHydrated) {
    return (
      <div className="post-rich-editor" aria-hidden="true">
        <div className="simple-editor-wrapper min-h-[320px]" />
      </div>
    )
  }

  return (
    <div className="post-rich-editor">
      <SimpleEditor
        initialContent={initialContent}
        contentKey={contentKey}
        placeholder={placeholder}
        onUpdate={handleUpdate}
        onEditorReady={handleEditorReady}
        onRequestMedia={() => setMediaPickerOpen(true)}
        onRequestAiEdit={handleOpenAiEdit}
      />

      <MediaPickerDialog
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleMediaSelect}
        mimeTypePrefix="image"
      />

      <Dialog
        open={aiEditDialogOpen}
        onOpenChange={(open) => {
          setAiEditDialogOpen(open)
          if (!open) {
            setAiEditError(null)
            setAiEditResult(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>AI 改写选中文本</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                当前选中文本
              </p>
              <p className="max-h-32 overflow-auto whitespace-pre-wrap text-sm leading-relaxed">
                {aiEditSelection?.text || "未选中文本"}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>改写方式</Label>
              <div className="flex flex-wrap gap-2">
                {AI_EDIT_OPERATIONS.map((operation) => (
                  <Button
                    key={operation.value}
                    type="button"
                    size="sm"
                    variant={
                      aiEditOperation === operation.value ? "default" : "outline"
                    }
                    onClick={() => setAiEditOperation(operation.value)}
                  >
                    {operation.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="ai-edit-instruction">补充要求（可选）</Label>
              <Textarea
                id="ai-edit-instruction"
                value={aiEditInstruction}
                onChange={(event) => setAiEditInstruction(event.target.value)}
                rows={3}
                placeholder="例如：保留技术名词，减少营销表达。"
                className="rounded-lg text-sm"
              />
            </div>

            {aiEditError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {aiEditError}
              </p>
            ) : null}

            {aiEditResult ? (
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  改写结果预览
                </p>
                <p className="max-h-48 overflow-auto whitespace-pre-wrap text-sm leading-relaxed">
                  {aiEditResult.text}
                </p>
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAiEditDialogOpen(false)}
              >
                取消
              </Button>
              {aiEditResult ? (
                <Button type="button" onClick={handleApplyAiEdit}>
                  替换选中文本
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={aiEditLoading || !aiEditSelection}
                  onClick={() => void handleGenerateAiEdit()}
                >
                  <Sparkles className="size-3.5" />
                  {aiEditLoading ? "生成中..." : "生成改写"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
