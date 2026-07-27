import { AccountForm } from "@/components/admin/account-form";
import { AdminPage } from "@/components/admin/admin-page";
import { getAdminAccountPageData } from "@/features/settings/queries/settings.queries";

export const metadata = {
  title: "账户设置",
  robots: "noindex, nofollow",
};

export default async function AccountPage() {
  const pageData = await getAdminAccountPageData();

  return (
    <AdminPage
      title="账户设置"
      description="管理账号信息、安全凭据与登录密码"
      contentClassName="max-w-lg"
    >
      <AccountForm
        defaultName={pageData.defaultName}
        showPasswordNotice={pageData.showPasswordNotice}
      />
    </AdminPage>
  );
}
