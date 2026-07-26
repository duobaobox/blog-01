"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAiSettings } from "@/features/ai/actions/ai-settings.actions";
import {
  AI_PROVIDER_PRESETS,
  getAiProviderPreset,
} from "@/features/ai/lib/ai-provider-presets";
import { getErrorMessage } from "@/shared/lib/app-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

interface AiSettingsFormProps {
  settings: {
    aiConfigured: boolean;
    aiProvider: string;
    aiBaseUrl: string | null;
    aiModel: string | null;
    aiProtocol: string;
    aiApiKeyConfigured: boolean;
  } | null;
}

export function AiSettingsForm({ settings }: AiSettingsFormProps) {
  const router = useRouter();
  const initialAiProvider = settings?.aiProvider || "openai-compatible";
  const initialAiPreset = getAiProviderPreset(initialAiProvider);
  const [aiProvider, setAiProvider] = useState(initialAiProvider);
  const [aiBaseUrl, setAiBaseUrl] = useState(
    settings?.aiBaseUrl ?? initialAiPreset.baseUrl,
  );
  const [aiModel, setAiModel] = useState(
    settings?.aiModel ?? initialAiPreset.defaultModel,
  );
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiClearApiKey, setAiClearApiKey] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [aiSaveError, setAiSaveError] = useState<string | null>(null);
  const currentPreset = settings?.aiProvider
    ? getAiProviderPreset(settings.aiProvider)
    : null;
  const isConfigured = Boolean(
    settings?.aiConfigured &&
      settings.aiApiKeyConfigured &&
      settings.aiBaseUrl &&
      settings.aiModel,
  );

  async function handleAiSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAiSaving(true);
    setAiSaved(false);
    setAiSaveError(null);

    try {
      const formData = new FormData(e.currentTarget);
      await updateAiSettings(formData);
      setAiApiKey("");
      setAiClearApiKey(false);
      setAiSaved(true);
      router.refresh();
      setTimeout(() => setAiSaved(false), 2000);
    } catch (error) {
      setAiSaveError(getErrorMessage(error, "AI 配置保存失败，请稍后重试。"));
    } finally {
      setAiSaving(false);
    }
  }

  function handleAiProviderChange(provider: string) {
    setAiProvider(provider);
    const preset = getAiProviderPreset(provider);
    setAiBaseUrl(preset.baseUrl);
    setAiModel(preset.defaultModel);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-card px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              当前绑定
            </p>
            <p className="mt-1 text-base font-semibold">
              {isConfigured
                ? `${currentPreset?.name ?? settings?.aiProvider} · ${settings?.aiModel}`
                : "尚未绑定可用 AI"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              AI SEO 和正文 AI 共用当前绑定；更换服务商或模型后重新保存即可。
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
            <span
              className={
                isConfigured
                  ? "size-2 rounded-full bg-emerald-500"
                  : "size-2 rounded-full bg-muted-foreground/40"
              }
            />
            {isConfigured ? "已绑定" : "未绑定"}
          </div>
        </div>
      </div>

    <form
      onSubmit={handleAiSubmit}
      className="space-y-6 rounded-xl border border-border/70 bg-card p-5"
    >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">绑定 AI 服务</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              选择服务商和模型，保存后 AI SEO 与正文 AI 即可按需使用。API Key 会使用服务端密钥加密保存，浏览器不会读取或回显原始 Key。
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
            <span
              className={
                settings?.aiConfigured && settings.aiApiKeyConfigured
                  ? "size-2 rounded-full bg-emerald-500"
                  : "size-2 rounded-full bg-muted-foreground/40"
              }
            />
            {settings?.aiConfigured && settings.aiApiKeyConfigured
              ? "已绑定"
              : "尚未绑定"}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="aiProvider">服务商</Label>
            <select
              id="aiProvider"
              name="aiProvider"
              value={aiProvider}
              onChange={(event) => handleAiProviderChange(event.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {AI_PROVIDER_PRESETS.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {getAiProviderPreset(aiProvider).description}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aiModel">模型名称</Label>
            <Input
              id="aiModel"
              name="aiModel"
              value={aiModel}
              onChange={(event) => setAiModel(event.target.value)}
              placeholder="例如：qwen-plus、deepseek-v4-flash"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aiBaseUrl">Base URL</Label>
          <Input
            id="aiBaseUrl"
            name="aiBaseUrl"
            value={aiBaseUrl}
            onChange={(event) => setAiBaseUrl(event.target.value)}
            placeholder="https://api.example.com/v1"
            required
          />
          {getAiProviderPreset(aiProvider).docsUrl ? (
            <p className="text-xs text-muted-foreground">
              请以服务商官方文档为准，必要时可以直接修改 Base URL。
              <a
                href={getAiProviderPreset(aiProvider).docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-foreground underline underline-offset-4"
              >
                查看官方文档
              </a>
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="aiApiKey">API Key</Label>
          <Input
            id="aiApiKey"
            name="aiApiKey"
            type="password"
            value={aiApiKey}
            onChange={(event) => setAiApiKey(event.target.value)}
            placeholder={
              settings?.aiApiKeyConfigured
                ? "已配置，留空表示保持不变"
                : "粘贴服务商 API Key"
            }
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">
            {settings?.aiApiKeyConfigured
              ? "当前已有 Key。只有输入新 Key 或勾选清除才会改变它。"
              : "Key 只在服务端使用，不会写入浏览器端配置。"}
          </p>
          {settings?.aiApiKeyConfigured ? (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                name="aiClearApiKey"
                value="true"
                checked={aiClearApiKey}
                onChange={(event) => setAiClearApiKey(event.target.checked)}
              />
              清除已保存的 API Key
            </label>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={aiSaving}>
            {aiSaving ? "保存中..." : "保存并绑定"}
          </Button>
          {aiSaved ? (
            <span className="text-sm text-emerald-600">AI 配置已保存</span>
          ) : null}
          {aiSaveError ? (
            <span className="text-sm text-destructive">{aiSaveError}</span>
          ) : null}
        </div>

    </form>
    </div>
  );
}
