import { Extension, type Extensions } from "@tiptap/core";
import { Highlight } from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Placeholder from "@tiptap/extension-placeholder";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import StarterKit from "@tiptap/starter-kit";
import { TableHandles } from "@/components/tiptap/extensions/table-handles-extension";
import { NodeBackground } from "@/components/tiptap/extensions/node-background-extension";
import { HorizontalRule } from "@/components/tiptap/nodes/horizontal-rule-node/horizontal-rule-node-extension";

export const HeadingIdAttribute = Extension.create({
  name: "headingIdAttribute",
  addGlobalAttributes() {
    return [
      {
        types: ["heading"],
        attributes: {
          id: {
            default: null,
            parseHTML: (element) => element.getAttribute("id"),
            renderHTML: (attributes) =>
              typeof attributes.id === "string" && attributes.id
                ? { id: attributes.id }
                : {},
          },
        },
      },
    ];
  },
});

export const TableRowHeightAttribute = Extension.create({
  name: "tableRowHeightAttribute",
  addGlobalAttributes() {
    return [
      {
        types: ["tableRow"],
        attributes: {
          rowHeight: {
            default: null,
            parseHTML: (element) => {
              const value =
                element.style.height ||
                element.getAttribute("data-row-height") ||
                "";
              const rowHeight = Number.parseInt(value, 10);
              return Number.isFinite(rowHeight) && rowHeight > 0
                ? rowHeight
                : null;
            },
            renderHTML: (attributes) => {
              const rowHeight = Number(attributes.rowHeight);
              if (!Number.isFinite(rowHeight) || rowHeight <= 0) return {};

              const normalizedHeight = Math.round(rowHeight);
              return {
                "data-row-height": String(normalizedHeight),
                style: `height: ${normalizedHeight}px`,
              };
            },
          },
        },
      },
    ];
  },
});

export function createPostContentExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
      horizontalRule: false,
      link: false,
    }),
    HeadingIdAttribute,
    TableRowHeightAttribute,
    NodeBackground,
    HorizontalRule,
    Link.configure({
      openOnClick: false,
      enableClickSelection: true,
      autolink: true,
      defaultProtocol: "https",
      isAllowedUri: (url, ctx) =>
        url.startsWith("/") || url.startsWith("#") || ctx.defaultValidate(url),
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Highlight.configure({
      multicolor: true,
    }),
    Image.configure({
      allowBase64: false,
      HTMLAttributes: {
        loading: "lazy",
        decoding: "async",
      },
    }),
    Typography,
    Superscript,
    Subscript,
    TableKit.configure({
      table: {
        resizable: true,
        handleWidth: 5,
        cellMinWidth: 80,
        lastColumnResizable: true,
        allowTableNodeSelection: true,
        renderWrapper: true,
        HTMLAttributes: {
          class: "tiptap-table",
        },
      },
      tableCell: {
        HTMLAttributes: {
          class: "tiptap-table-cell",
        },
      },
      tableHeader: {
        HTMLAttributes: {
          class: "tiptap-table-header",
        },
      },
      tableRow: {
        HTMLAttributes: {
          class: "tiptap-table-row",
        },
      },
    }),
  ];
}

type CreatePostEditorExtensionsOptions = {
  placeholder?: string;
};

export function createPostEditorExtensions(
  options: CreatePostEditorExtensionsOptions = {},
): Extensions {
  const extensions: Extensions = [
    ...createPostContentExtensions(),
    TableHandles,
  ];

  if (options.placeholder) {
    extensions.push(
      Placeholder.configure({
        placeholder: options.placeholder,
      }),
    );
  }

  return extensions;
}
