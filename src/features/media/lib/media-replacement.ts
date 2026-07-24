import { ValidationError } from "@/shared/lib/app-error";

export function assertCompatibleMediaReplacement(
  currentMimeType: string,
  nextMimeType: string,
) {
  const current = currentMimeType.trim().toLowerCase();
  const next = nextMimeType.trim().toLowerCase();

  if (!current || !next || current !== next) {
    throw new ValidationError(
      "替换文件必须与原文件类型一致；如需更换格式，请上传为新媒体并重新选择。",
    );
  }
}
