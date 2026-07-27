import { requireAdminSession, type AuthSession } from "@/infrastructure/auth";

export type AdminSessionIdentity = Pick<
  AuthSession["user"],
  "id" | "name" | "role"
>;

export function toAdminSessionIdentity(
  session: Pick<AuthSession, "user">,
): AdminSessionIdentity {
  return {
    id: session.user.id,
    name: session.user.name,
    role: session.user.role,
  };
}

type AdminSessionIdentityQueryDependencies = {
  requireAdminSession: typeof requireAdminSession;
};

export function createAdminSessionIdentityQuery(
  dependencies: Partial<AdminSessionIdentityQueryDependencies> = {
    requireAdminSession,
  },
) {
  const resolvedDependencies: AdminSessionIdentityQueryDependencies = {
    requireAdminSession,
    ...dependencies,
  };

  return async function getAdminSessionIdentity(): Promise<AdminSessionIdentity> {
    return toAdminSessionIdentity(
      await resolvedDependencies.requireAdminSession(),
    );
  };
}

const getAdminSessionIdentityQuery = createAdminSessionIdentityQuery();

export async function getAdminSessionIdentity(): Promise<AdminSessionIdentity> {
  return getAdminSessionIdentityQuery();
}
