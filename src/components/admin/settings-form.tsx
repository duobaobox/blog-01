"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { updateSiteSettings } from "@/features/settings/actions/settings.actions";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { HelpCircle, ImagePlus, Trash2 } from "lucide-react";
import { MediaPickerDialog } from "@/features/media/components/media-picker-dialog";
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
  const [logoUrl, setLogoUrl] = useState(settings?.logoUrl ?? "");
  const [avatarUrl, setAvatarUrl] = useState(settings?.avatarUrl ?? "");
  const [pickerField, setPickerField] = useState<"logoUrl" | "avatarUrl" | null>(
    null,
  );

  function handleMediaSelect(url: string) {
    if (pickerField === "logoUrl") {
      setLogoUrl(url);
    }

    if (pickerField === "avatarUrl") {
      setAvatarUrl(url);
    }
  }

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
          <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            当前站点信息还比较基础。建议优先完善站点标题；站点 URL、Logo 和头像都可以后续再补。
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
              placeholder="https://your-domain.com"
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
            <Label htmlFor="logoUrl">Logo</Label>
            <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 p-3">
              <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="Logo 预览"
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">未设置</span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                  placeholder="可直接粘贴图片 URL"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerField("logoUrl")}
                  >
                    <ImagePlus />
                    从媒体库选择
                  </Button>
                  {logoUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setLogoUrl("")}
                    >
                      <Trash2 />
                      清除
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">头像</Label>
            <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 p-3">
              <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-background">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="头像预览"
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">未设置</span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <Input
                  id="avatarUrl"
                  name="avatarUrl"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="可直接粘贴图片 URL"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerField("avatarUrl")}
                  >
                    <ImagePlus />
                    从媒体库选择
                  </Button>
                  {avatarUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAvatarUrl("")}
                    >
                      <Trash2 />
                      清除
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
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
      <MediaPickerDialog
        open={pickerField !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPickerField(null);
          }
        }}
        onSelect={(media) => {
          handleMediaSelect(media.url);
          setPickerField(null);
        }}
      />
    </TooltipProvider>
  );
}
