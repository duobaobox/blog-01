"use client"

import { useCallback, useState } from "react"
import { Table2 } from "lucide-react"

import { ChevronDownIcon } from "@/components/tiptap/icons/chevron-down-icon"
import { Button } from "@/components/tiptap/ui-primitive/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/tiptap/ui-primitive/dropdown-menu"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

const TABLE_PRESETS = [
  { label: "2 × 2 简单表格", rows: 2, cols: 2, withHeaderRow: false },
  { label: "3 × 3 标准表格", rows: 3, cols: 3, withHeaderRow: true },
  { label: "4 × 4 标准表格", rows: 4, cols: 4, withHeaderRow: true },
] as const

export type TableDropdownMenuProps = {
  modal?: boolean
}

export function TableDropdownMenu({
  modal = false,
}: TableDropdownMenuProps) {
  const { editor } = useTiptapEditor()
  const [isOpen, setIsOpen] = useState(false)

  const insertTable = useCallback(
    (preset: (typeof TABLE_PRESETS)[number]) => {
      if (!editor) return

      editor
        .chain()
        .focus()
        .insertTable({
          rows: preset.rows,
          cols: preset.cols,
          withHeaderRow: preset.withHeaderRow,
        })
        .run()
    },
    [editor],
  )

  return (
    <DropdownMenu
      modal={modal}
      open={isOpen}
      onOpenChange={(open) => editor && setIsOpen(open)}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          tabIndex={-1}
          disabled={!editor}
          data-active-state={editor?.isActive("table") ? "on" : "off"}
          aria-label="插入表格"
          tooltip="插入表格"
        >
          <Table2 className="tiptap-button-icon" />
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          {TABLE_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.label}
              onSelect={() => insertTable(preset)}
            >
              <Table2 aria-hidden="true" />
              <span>{preset.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
