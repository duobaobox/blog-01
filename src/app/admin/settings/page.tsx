export const dynamic = "force-dynamic";

import { getSiteSettings } from "@/actions/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">站点设置</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
