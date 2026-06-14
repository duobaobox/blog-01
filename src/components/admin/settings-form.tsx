"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSiteSettings } from "@/features/settings/actions/settings.actions";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

interface SettingsFormProps {
  settings: {
    siteTitle: string;
    siteSubtitle: string | null;
    siteDescription: string | null;
    siteUrl: string;
    logoUrl: string | null;
    avatarUrl: string | null;
    githubUrl: string | null;
    xUrl: string | null;
    email: string | null;
    footerText: string | null;
  } | null;
  showSetupNotice?: boolean;
}

export function SettingsForm({
  settings,
  showSetupNotice = false,
}: SettingsFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError(null);

    try {
      const formData = new FormData(e.currentTarget);
      await updateSiteSettings(formData);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "保存失败，请稍后重试。",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-6">
        {showSetupNotice ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            当前仍是默认站点信息。建议至少先改掉站点标题和站点 URL，这样前台展示、SEO 和后续分享地址都会正常。
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="siteTitle">站点标题</Label>
            <Input
              id="siteTitle"
              name="siteTitle"
              defaultValue={settings?.siteTitle ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteSubtitle">副标题</Label>
            <Input
              id="siteSubtitle"
              name="siteSubtitle"
              defaultValue={settings?.siteSubtitle ?? ""}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="siteDescription">站点描述</Label>
            <Tooltip>
              <TooltipTrigger
                render={
                  <HelpCircle className="size-3.5 cursor-help text-muted-foreground/60 transition-colors hover:text-muted-foreground" />
                }
              />
              <TooltipContent>
                网站的全局 SEO 描述，用于首页和未设置单独描述的页面。
              </TooltipContent>
            </Tooltip>
          </div>
          <Textarea
            id="siteDescription"
            name="siteDescription"
            defaultValue={settings?.siteDescription ?? ""}
            rows={3}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="siteUrl">站点 URL</Label>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <HelpCircle className="size-3.5 cursor-help text-muted-foreground/60 transition-colors hover:text-muted-foreground" />
                  }
                />
                <TooltipContent>
                  网站的官方主域名，用于生成 SEO 规范链接、RSS 订阅和社交分享预览。
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="siteUrl"
              name="siteUrl"
              defaultValue={settings?.siteUrl ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={settings?.email ?? ""}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              name="logoUrl"
              defaultValue={settings?.logoUrl ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">头像 URL</Label>
            <Input
              id="avatarUrl"
              name="avatarUrl"
              defaultValue={settings?.avatarUrl ?? ""}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="githubUrl">GitHub URL</Label>
            <Input
              id="githubUrl"
              name="githubUrl"
              defaultValue={settings?.githubUrl ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="xUrl">X (Twitter) URL</Label>
            <Input id="xUrl" name="xUrl" defaultValue={settings?.xUrl ?? ""} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="footerText">页脚文本</Label>
          <Input
            id="footerText"
            name="footerText"
            defaultValue={settings?.footerText ?? ""}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "保存中..." : "保存设置"}
          </Button>
          {saved && <span className="text-sm text-green-600">已保存</span>}
          {saveError && (
            <span className="text-sm text-destructive">{saveError}</span>
          )}
        </div>
      </form>
    </TooltipProvider>
  );
}
