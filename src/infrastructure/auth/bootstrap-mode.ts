export type AdminBootstrapMode =
  | {
      kind: "closed";
      canInitialize: false;
      usesDefaultAdmin: false;
      requiresSetupToken: false;
      showsDefaultAdminLoginHint: false;
    }
  | {
      kind: "development-default-admin";
      canInitialize: true;
      usesDefaultAdmin: true;
      requiresSetupToken: false;
      showsDefaultAdminLoginHint: true;
    }
  | {
      kind: "manual-admin-signup";
      canInitialize: true;
      usesDefaultAdmin: false;
      requiresSetupToken: boolean;
      showsDefaultAdminLoginHint: false;
    };

function hasConfiguredSetupToken(configuredToken: string | null | undefined) {
  return Boolean(configuredToken?.trim());
}

function isProduction(nodeEnv: string | null | undefined) {
  return nodeEnv === "production";
}

export function resolveAdminBootstrapMode(input: {
  bootstrapAllowed: boolean;
  configuredToken?: string | null | undefined;
  nodeEnv?: string | null | undefined;
}): AdminBootstrapMode {
  if (!input.bootstrapAllowed) {
    return {
      kind: "closed",
      canInitialize: false,
      usesDefaultAdmin: false,
      requiresSetupToken: false,
      showsDefaultAdminLoginHint: false,
    };
  }

  if (
    isProduction(input.nodeEnv ?? process.env.NODE_ENV) ||
    hasConfiguredSetupToken(
      input.configuredToken ?? process.env.ADMIN_SETUP_TOKEN,
    )
  ) {
    return {
      kind: "manual-admin-signup",
      canInitialize: true,
      usesDefaultAdmin: false,
      requiresSetupToken: hasConfiguredSetupToken(
        input.configuredToken ?? process.env.ADMIN_SETUP_TOKEN,
      ),
      showsDefaultAdminLoginHint: false,
    };
  }

  return {
    kind: "development-default-admin",
    canInitialize: true,
    usesDefaultAdmin: true,
    requiresSetupToken: false,
    showsDefaultAdminLoginHint: true,
  };
}

export function shouldAllowDefaultAdminLoginHint(input: {
  configuredToken?: string | null | undefined;
  nodeEnv?: string | null | undefined;
}) {
  return (
    !isProduction(input.nodeEnv ?? process.env.NODE_ENV) &&
    !hasConfiguredSetupToken(
      input.configuredToken ?? process.env.ADMIN_SETUP_TOKEN,
    )
  );
}
