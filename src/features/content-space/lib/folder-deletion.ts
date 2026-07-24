import { ValidationError } from "@/shared/lib/app-error";

export function assertFolderCanBeDeleted(postCount: number) {
  if (postCount > 0) {
    throw new ValidationError("文件夹内还有笔记，请先移动这些笔记");
  }
}
