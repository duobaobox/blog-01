import { requireAdminSession } from "@/infrastructure/auth";
import { AccountForm } from "@/components/admin/account-form";

export const metadata = {
  title: "账户设置",
  robots: "noindex, nofollow",
};

export default async function AccountPage() {
  const session = await requireAdminSession();

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <div>
        <h1 className="text-xl font-semibold">账户设置</h1>
        <p className="text-sm text-muted-foreground mt-1">
          管理你的账号信息和密码
        </p>
      </div>
      <div className="max-w-lg">
        <AccountForm
          defaultName={session.user.name}
          email={session.user.email}
        />
      </div>
    </div>
  );
}
