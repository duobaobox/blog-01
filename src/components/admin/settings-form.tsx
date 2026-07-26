"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HelpCircle, ImagePlus, Trash2 } from "lucide-react";
import { updateSiteSettings } from "@/features/settings/actions/settings.actions";
import { MediaPickerDialog } from "@/features/media/components/media-picker-dialog";
import { getErrorMessage } from "@/shared/lib/app-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

interface SettingsFormProps {
  settings: {
    siteTitle: string;
    siteDescription: string | null;
    siteUrl: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    email: string | null;
    footerText: string | null;
  } | null;
  showSetupNotice?: boolean;
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-border/70 px-4 py-3.5 md:px-5">
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
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
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState(settings?.faviconUrl ?? "");
  const [faviconPickerOpen, setFaviconPickerOpen] = useState(false);

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
      setSaveError(getErrorMessage(error, "保存失败，请稍后重试。"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-5">
        {showSetupNotice ? (
          <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            先完善站点标题即可开始使用；域名和 Logo 可以在正式发布前补充。
          </div>
        ) : null}

        <section className="overflow-hidden rounded-xl border border-border/70 bg-card/40">
          <SectionHeading
            title="站点身份"
            description="这些信息会用于导航栏、页脚和搜索引擎摘要。"
          />
          <div className="grid gap-5 p-4 md:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.55fr)]">
            <div className="space-y-5">
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
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="siteDescription">站点描述</Label>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <HelpCircle className="size-3.5 cursor-help text-muted-foreground/60 transition-colors hover:text-muted-foreground" />
                      }
                    />
                    <TooltipContent>
                      用于首页、页脚和未单独设置描述页面的 SEO 摘要。
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  id="siteDescription"
                  name="siteDescription"
                  defaultValue={settings?.siteDescription ?? ""}
                  rows={4}
                  placeholder="简要说明这个站点记录什么内容"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">站点 Logo</Label>
                <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-background">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt="Logo 预览"
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          未设置
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">导航栏标识</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        建议使用方形图片；可从媒体库选择，也可填写站内路径或完整图片地址。
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Input
                      id="logoUrl"
                      name="logoUrl"
                      value={logoUrl}
                      onChange={(event) => setLogoUrl(event.target.value)}
                      placeholder="/media/logo.png"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLogoPickerOpen(true)}
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
                <Label htmlFor="faviconUrl">浏览器标签图标</Label>
                <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background">
                      {faviconUrl ? (
                        <Image
                          src={faviconUrl}
                          alt="浏览器标签图标预览"
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          未设置
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                      用于浏览器 Tab、收藏夹和分享入口。建议使用清晰的方形图标。
                    </p>
                  </div>

                  <div className="mt-3 space-y-2">
                    <Input
                      id="faviconUrl"
                      name="faviconUrl"
                      value={faviconUrl}
                      onChange={(event) => setFaviconUrl(event.target.value)}
                      placeholder="/media/favicon.png"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFaviconPickerOpen(true)}
                      >
                        <ImagePlus />
                        从媒体库选择
                      </Button>
                      {faviconUrl ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFaviconUrl("")}
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
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border/70 bg-card/40">
          <SectionHeading
            title="发布与联系"
            description="站点地址用于生成规范链接和订阅地址；联系信息会显示在页脚。"
          />
          <div className="grid gap-5 p-4 md:grid-cols-2 md:p-5">
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
                    正式域名，用于 SEO 规范链接、RSS、站点地图和分享预览。
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
              <Label htmlFor="email">联系邮箱</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={settings?.email ?? ""}
                placeholder="hello@example.com"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="footerText">页脚版权文字</Label>
              <Input
                id="footerText"
                name="footerText"
                defaultValue={settings?.footerText ?? ""}
                placeholder="留空时自动生成当前年份与站点名称"
              />
            </div>
          </div>
        </section>

        <div className="flex min-h-9 flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "保存中..." : "保存设置"}
          </Button>
          {saved ? (
            <span className="text-sm text-green-600">已保存</span>
          ) : null}
          {saveError ? (
            <span className="text-sm text-destructive">{saveError}</span>
          ) : null}
        </div>
      </form>

      <MediaPickerDialog
        open={logoPickerOpen}
        onOpenChange={setLogoPickerOpen}
        onSelect={(media) => {
          setLogoUrl(media.url);
          setLogoPickerOpen(false);
        }}
      />
      <MediaPickerDialog
        open={faviconPickerOpen}
        onOpenChange={setFaviconPickerOpen}
        onSelect={(media) => {
          setFaviconUrl(media.url);
          setFaviconPickerOpen(false);
        }}
      />
    </TooltipProvider>
  );
}
