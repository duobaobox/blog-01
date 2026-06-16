import { UnauthorizedError } from "@/shared/lib/app-error";

export function getAdminShellAuthRedirect(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return "/admin/login";
  }

  return null;
}
