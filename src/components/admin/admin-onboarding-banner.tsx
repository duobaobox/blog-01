import Link from "next/link";
import { Button } from "@/shared/ui/button";

type AdminOnboardingBannerProps = {
  needsPasswordChange: boolean;
  needsSiteSetup: boolean;
};

export function AdminOnboardingBanner({
  needsPasswordChange,
  needsSiteSetup,
}: AdminOnboardingBannerProps) {
  if (!needsPasswordChange && !needsSiteSetup) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">首次启动已可直接使用，建议先完成基础初始化。</p>
          <p className="text-sm text-amber-900/80">
            {needsPasswordChange && needsSiteSetup
              ? "请先修改默认管理员密码，并补全站点标题、域名等基础信息。"
              : needsPasswordChange
                ? "请先修改默认管理员密码，避免继续使用初始登录凭据。"
                : "请先补全站点标题、域名等基础信息，完成开箱后的第一次配置。"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {needsPasswordChange ? (
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              render={<Link href="/admin/account" />}
            >
              去修改密码
            </Button>
          ) : null}
          {needsSiteSetup ? (
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              render={<Link href="/admin/settings" />}
            >
              去完善站点设置
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
