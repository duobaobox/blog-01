import { ValidationError } from "@/shared/lib/app-error";

export function parseMediaFileFormData(formData: FormData) {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new ValidationError("No file provided");
  }

  return file;
}
