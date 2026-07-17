"use client"

import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"
import type { Editor } from "@tiptap/core"
import {
  parseStoredContentJson,
  stringifyContentJson,
} from "@/features/editor/content-types"
import {
  SimpleEditor,
  type SimpleEditorUpdate,
} from "@/components/tiptap-templates/simple/simple-editor"
import { MediaPickerDialog } from "@/features/media/components/media-picker-dialog"
import type { MediaItem } from "@/features/media/types/storage.types"

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

  if (!hasHydrated) {
    return (
      <div
        className="simple-editor-wrapper min-h-[320px]"
        aria-hidden="true"
      />
    )
  }

  return (
    <>
      <SimpleEditor
        initialContent={initialContent}
        contentKey={contentKey}
        placeholder={placeholder}
        onUpdate={handleUpdate}
        onEditorReady={handleEditorReady}
        onRequestMedia={() => setMediaPickerOpen(true)}
      />

      <MediaPickerDialog
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleMediaSelect}
        mimeTypePrefix="image"
      />
    </>
  )
}
