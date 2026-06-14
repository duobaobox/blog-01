import Link from "next/link";
import { ShieldAlert } from "lucide-react";
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
    <div className="border-b border-border/70 bg-muted/35 px-4 py-2.5 text-foreground">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-background/80 p-1.5 text-muted-foreground shadow-sm ring-1 ring-border/60">
            <ShieldAlert className="size-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              首次启动已可直接使用，建议顺手完成基础初始化。
            </p>
            <p className="text-sm text-muted-foreground">
              {needsPasswordChange && needsSiteSetup
                ? "建议先修改默认管理员密码，再补齐站点标题等基础信息。"
                : needsPasswordChange
                  ? "建议先修改默认管理员密码，避免继续使用初始登录凭据。"
                  : "站点信息还比较基础，后续有空时可以再补齐。"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {needsPasswordChange ? (
            <Button
              nativeButton={false}
              variant="ghost"
              size="sm"
              render={<Link href="/admin/account" />}
            >
              去修改密码
            </Button>
          ) : null}
          {needsSiteSetup ? (
            <Button
              nativeButton={false}
              variant="ghost"
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
