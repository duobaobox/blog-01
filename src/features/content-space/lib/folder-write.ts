import {
  normalizeOptionalString,
  requireTrimmedString,
} from "@/shared/lib/validation";

export type FolderWriteInput = {
  name: string;
  description: string | null;
};

export function parseFolderWriteFormData(formData: FormData): FolderWriteInput {
  return {
    name: requireTrimmedString(formData.get("name"), "文件夹名称不能为空"),
    description: normalizeOptionalString(formData.get("description")),
  };
}
