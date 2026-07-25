import { unstable_cache } from "next/cache";
import { getAdminSessionIdentity, type AdminSessionIdentity } from "@/infrastructure/auth/admin-session";
import {
  ADMIN_CACHE_REVALIDATE_SECONDS,
  ADMIN_CACHE_TAGS,
} from "@/infrastructure/cache/admin-cache";
import { isDefaultAdminPasswordActive } from "@/infrastructure/auth/bootstrap";
import { needsSiteBasicSetupFromTitle } from "@/features/settings/lib/site-setup";
import * as settingsRepo from "@/features/settings/repositories/settings.repository";

export type AdminOnboardingStatus = {
  needsSiteSetup: boolean;
};

export type AdminAccountSecurityStatus = {
  needsPasswordChange: boolean;
};

export type AdminShellStatus = {
  onboarding: AdminOnboardingStatus;
  security: AdminAccountSecurityStatus;
};

export type AdminSettingsPageData = {
  settings: Awaited<ReturnType<typeof settingsRepo.findSiteSettingsForAdmin>>;
  showSetupNotice: boolean;
};

export type AdminAccountPageData = {
  defaultName: string;
  showPasswordNotice: boolean;
};

export type AdminShellPageData = {
  session: AdminSessionIdentity;
  shellStatus: AdminShellStatus;
};

export async function getSiteSettings() {
  return getSiteSettingsCached();
}

const getSiteSettingsCached = unstable_cache(
  () => settingsRepo.findSiteSettings(),
  ["admin-site-settings"],
  {
    revalidate: ADMIN_CACHE_REVALIDATE_SECONDS,
    tags: [ADMIN_CACHE_TAGS.settings],
  },
);

const getAdminSiteSettingsCached = unstable_cache(
  () => settingsRepo.findSiteSettingsForAdmin(),
  ["admin-site-settings-safe"],
  {
    revalidate: ADMIN_CACHE_REVALIDATE_SECONDS,
    tags: [ADMIN_CACHE_TAGS.settings],
  },
);

export async function getAdminSiteSettings() {
  return getAdminSiteSettingsCached();
}

export async function getSiteSetupStatus() {
  return getSiteSetupStatusCached();
}

type AdminSettingsPageDataDependencies = {
  getSiteSettings: () => Promise<AdminSettingsPageData["settings"]>;
  getSiteSetupStatus: () => Promise<boolean>;
};

export function createAdminSettingsPageDataQuery(
  dependencies: AdminSettingsPageDataDependencies = {
    getSiteSettings: getAdminSiteSettings,
    getSiteSetupStatus,
  },
) {
  return async function getAdminSettingsPageData(): Promise<AdminSettingsPageData> {
    const [settings, showSetupNotice] = await Promise.all([
      dependencies.getSiteSettings(),
      dependencies.getSiteSetupStatus(),
    ]);

    return {
      settings,
      showSetupNotice,
    };
  };
}

const getAdminSettingsPageDataQuery = createAdminSettingsPageDataQuery();

export async function getAdminSettingsPageData(): Promise<AdminSettingsPageData> {
  return getAdminSettingsPageDataQuery();
}

type AdminAccountPageDataDependencies = {
  getAdminSessionIdentity: () => Promise<AdminSessionIdentity>;
  getAdminAccountSecurityStatus: (input: {
    userId: string;
  }) => Promise<AdminAccountSecurityStatus>;
};

export function createAdminAccountPageDataQuery(
  dependencies: Partial<AdminAccountPageDataDependencies> = {
    getAdminSessionIdentity,
    getAdminAccountSecurityStatus,
  },
) {
  const resolvedDependencies: AdminAccountPageDataDependencies = {
    getAdminSessionIdentity,
    getAdminAccountSecurityStatus,
    ...dependencies,
  };

  return async function getAdminAccountPageData(): Promise<AdminAccountPageData> {
    const session = await resolvedDependencies.getAdminSessionIdentity();
    const security = await resolvedDependencies.getAdminAccountSecurityStatus({
      userId: session.id,
    });

    return {
      defaultName: session.name,
      showPasswordNotice: security.needsPasswordChange,
    };
  };
}

const getAdminAccountPageDataQuery = createAdminAccountPageDataQuery();

export async function getAdminAccountPageData(): Promise<AdminAccountPageData> {
  return getAdminAccountPageDataQuery();
}

export async function getAdminOnboardingStatus(): Promise<AdminOnboardingStatus> {
  const needsSiteSetup = await getSiteSetupStatusCached();

  return {
    needsSiteSetup,
  };
}

type AdminShellStatusDependencies = {
  getAdminOnboardingStatus: () => Promise<AdminOnboardingStatus>;
  getAdminAccountSecurityStatus: (input: {
    userId: string;
  }) => Promise<AdminAccountSecurityStatus>;
};

export function createAdminShellStatusQuery(
  dependencies: AdminShellStatusDependencies = {
    getAdminOnboardingStatus,
    getAdminAccountSecurityStatus,
  },
) {
  return async function getAdminShellStatus(input: {
    userId: string;
  }): Promise<AdminShellStatus> {
    const [onboarding, security] = await Promise.all([
      dependencies.getAdminOnboardingStatus(),
      dependencies.getAdminAccountSecurityStatus({
        userId: input.userId,
      }),
    ]);

    return {
      onboarding,
      security,
    };
  };
}

const getAdminShellStatusQuery = createAdminShellStatusQuery();

export async function getAdminShellStatus(input: {
  userId: string;
}): Promise<AdminShellStatus> {
  return getAdminShellStatusQuery(input);
}

type AdminShellPageDataDependencies = {
  getAdminSessionIdentity: () => Promise<AdminSessionIdentity>;
  getAdminShellStatus: (input: { userId: string }) => Promise<AdminShellStatus>;
};

export function createAdminShellPageDataQuery(
  dependencies: Partial<AdminShellPageDataDependencies> = {
    getAdminSessionIdentity,
    getAdminShellStatus,
  },
) {
  const resolvedDependencies: AdminShellPageDataDependencies = {
    getAdminSessionIdentity,
    getAdminShellStatus,
    ...dependencies,
  };

  return async function getAdminShellPageData(): Promise<AdminShellPageData> {
    const session = await resolvedDependencies.getAdminSessionIdentity();
    const shellStatus = await resolvedDependencies.getAdminShellStatus({
      userId: session.id,
    });

    return {
      session,
      shellStatus,
    };
  };
}

const getAdminShellPageDataQuery = createAdminShellPageDataQuery();

export async function getAdminShellPageData(): Promise<AdminShellPageData> {
  return getAdminShellPageDataQuery();
}

export async function getAdminAccountSecurityStatus(input: {
  userId: string;
}): Promise<AdminAccountSecurityStatus> {
  const needsPasswordChange = await isDefaultAdminPasswordActive(input.userId);

  return {
    needsPasswordChange,
  };
}

const getSiteSetupStatusCached = unstable_cache(
  async () => {
    const settings = await settingsRepo.findSiteSettingsSummary();
    return needsSiteBasicSetupFromTitle(settings?.siteTitle);
  },
  ["admin-site-setup-status"],
  {
    revalidate: ADMIN_CACHE_REVALIDATE_SECONDS,
    tags: [ADMIN_CACHE_TAGS.settings],
  },
);
