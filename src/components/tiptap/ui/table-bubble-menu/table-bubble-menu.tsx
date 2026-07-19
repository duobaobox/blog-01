"use client"

import type { Editor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import { CellSelection } from "@tiptap/pm/tables"
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  Columns3Icon,
  MergeIcon,
  PlusIcon,
  RowsIcon,
  SplitIcon,
  TableIcon,
  Trash2Icon,
} from "lucide-react"

import "@/components/tiptap/ui/table-bubble-menu/table-bubble-menu.scss"

export type TableBubbleMenuProps = {
  editor: Editor
}

export function TableBubbleMenu({ editor }: TableBubbleMenuProps) {
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="post-table-bubble-menu"
      className="table-bubble-menu"
      options={{ placement: "top" }}
      onMouseDown={(event) => event.preventDefault()}
      shouldShow={({ editor: currentEditor, state }) => {
        if (!currentEditor.isEditable || !currentEditor.isActive("table")) {
          return false
        }

        const { selection } = state
        return selection instanceof CellSelection || selection.empty
      }}
    >
      <div className="table-menu-group">
        <span className="table-menu-label">
          <RowsIcon size={12} aria-hidden="true" />
          行
        </span>
        <button
          type="button"
          className="table-menu-button"
          aria-label="在上方插入行"
          title="在上方插入行"
          disabled={!editor.can().addRowBefore()}
          onClick={() => editor.chain().focus().addRowBefore().run()}
        >
          <ArrowUpIcon size={14} aria-hidden="true" />
          <PlusIcon
            size={9}
            className="table-menu-plus"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          className="table-menu-button"
          aria-label="在下方插入行"
          title="在下方插入行"
          disabled={!editor.can().addRowAfter()}
          onClick={() => editor.chain().focus().addRowAfter().run()}
        >
          <ArrowDownIcon size={14} aria-hidden="true" />
          <PlusIcon
            size={9}
            className="table-menu-plus"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          className="table-menu-button"
          data-danger="true"
          aria-label="删除当前行"
          title="删除当前行"
          disabled={!editor.can().deleteRow()}
          onClick={() => editor.chain().focus().deleteRow().run()}
        >
          <Trash2Icon size={14} aria-hidden="true" />
        </button>
      </div>

      <span className="table-menu-divider" aria-hidden="true" />

      <div className="table-menu-group">
        <span className="table-menu-label">
          <Columns3Icon size={12} aria-hidden="true" />
          列
        </span>
        <button
          type="button"
          className="table-menu-button"
          aria-label="在左侧插入列"
          title="在左侧插入列"
          disabled={!editor.can().addColumnBefore()}
          onClick={() => editor.chain().focus().addColumnBefore().run()}
        >
          <ArrowLeftIcon size={14} aria-hidden="true" />
          <PlusIcon
            size={9}
            className="table-menu-plus"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          className="table-menu-button"
          aria-label="在右侧插入列"
          title="在右侧插入列"
          disabled={!editor.can().addColumnAfter()}
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        >
          <ArrowRightIcon size={14} aria-hidden="true" />
          <PlusIcon
            size={9}
            className="table-menu-plus"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          className="table-menu-button"
          data-danger="true"
          aria-label="删除当前列"
          title="删除当前列"
          disabled={!editor.can().deleteColumn()}
          onClick={() => editor.chain().focus().deleteColumn().run()}
        >
          <Trash2Icon size={14} aria-hidden="true" />
        </button>
      </div>

      <span className="table-menu-divider" aria-hidden="true" />

      <div className="table-menu-group">
        <button
          type="button"
          className="table-menu-button"
          aria-label="合并选中的单元格"
          title="合并单元格"
          disabled={!editor.can().mergeCells()}
          onClick={() => editor.chain().focus().mergeCells().run()}
        >
          <MergeIcon size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="table-menu-button"
          aria-label="拆分当前单元格"
          title="拆分单元格"
          disabled={!editor.can().splitCell()}
          onClick={() => editor.chain().focus().splitCell().run()}
        >
          <SplitIcon size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="table-menu-button"
          data-active={editor.isActive("tableHeader")}
          aria-label="切换表头行"
          title="切换表头行"
          disabled={!editor.can().toggleHeaderRow()}
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
        >
          <RowsIcon size={14} aria-hidden="true" />
          <span className="table-menu-button-text">表头</span>
        </button>
      </div>

      <span className="table-menu-divider" aria-hidden="true" />

      <button
        type="button"
        className="table-menu-button"
        data-danger="true"
        aria-label="删除整个表格"
        title="删除表格"
        disabled={!editor.can().deleteTable()}
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        <TableIcon size={14} aria-hidden="true" />
        <Trash2Icon size={11} aria-hidden="true" />
      </button>
    </BubbleMenu>
  )
}
