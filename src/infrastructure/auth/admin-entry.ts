import type { AdminBootstrapMode } from "@/infrastructure/auth/bootstrap-mode";

export function shouldRedirectLoginToSetup(input: {
  bootstrapMode: AdminBootstrapMode;
}) {
  return input.bootstrapMode.canInitialize;
}

export function shouldRunAdminSetup(input: {
  bootstrapMode: AdminBootstrapMode;
}) {
  return input.bootstrapMode.canInitialize;
}

export function shouldCreateDefaultAdminOnSetup(input: {
  bootstrapMode: AdminBootstrapMode;
}) {
  return input.bootstrapMode.kind === "development-default-admin";
}

export function shouldRenderManualAdminSetup(input: {
  bootstrapMode: AdminBootstrapMode;
}) {
  return input.bootstrapMode.kind === "manual-admin-signup";
}
