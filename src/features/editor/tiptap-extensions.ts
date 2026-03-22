import { Extension, type Extensions } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import StarterKit from "@tiptap/starter-kit";

const HeadingIdAttribute = Extension.create({
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

type CreatePostEditorExtensionsOptions = {
  placeholder?: string;
};

export function createPostEditorExtensions(
  options: CreatePostEditorExtensionsOptions = {},
): Extensions {
  const extensions: Extensions = [
    HeadingIdAttribute,
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      protocols: ["http", "https", "mailto", "tel"],
      isAllowedUri: (url, ctx) =>
        url.startsWith("/") || url.startsWith("#") || ctx.defaultValidate(url),
    }),
    Image.configure({
      allowBase64: false,
      HTMLAttributes: {
        loading: "lazy",
        decoding: "async",
      },
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    TableKit,
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
