import { normalizeTagColor } from "@/features/taxonomy/lib/tag-color";
import {
  normalizeOptionalString,
  requireTrimmedString,
} from "@/shared/lib/validation";

export type CategoryWriteInput = {
  name: string;
  description: string | null;
};

export type TagWriteInput = {
  name: string;
  description: string | null;
  color: string | null;
};

export function parseCategoryWriteFormData(
  formData: FormData,
): CategoryWriteInput {
  return {
    name: requireTrimmedString(formData.get("name"), "分类名称不能为空"),
    description: normalizeOptionalString(formData.get("description")),
  };
}

export function parseTagWriteFormData(formData: FormData): TagWriteInput {
  return {
    name: requireTrimmedString(formData.get("name"), "标签名称不能为空"),
    description: normalizeOptionalString(formData.get("description")),
    color: normalizeTagColor(formData.get("color") as string),
  };
}
