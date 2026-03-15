"use client";

import { useState } from "react";
import { updateSiteSettings } from "@/features/settings/actions/settings.actions";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

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
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    await updateSiteSettings(formData);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        <Label htmlFor="siteDescription">站点描述</Label>
        <Textarea
          id="siteDescription"
          name="siteDescription"
          defaultValue={settings?.siteDescription ?? ""}
          rows={3}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="siteUrl">站点 URL</Label>
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
      </div>
    </form>
  );
}
