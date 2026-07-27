"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateAiSettings } from "@/features/ai/actions/ai-settings.actions";
import {
  AI_PROVIDER_PRESETS,
  getAiProviderPreset,
} from "@/features/ai/lib/ai-provider-presets";
import type { AdminAiSettingsPageData } from "@/features/ai/queries/ai-settings.queries";
import { getErrorMessage } from "@/shared/lib/app-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type AiSettings = AdminAiSettingsPageData["settings"];

type AiSettingsBindingFormProps = {
  settings: AiSettings;
};

export function AiSettingsBindingForm({
  settings,
}: AiSettingsBindingFormProps) {
  const router = useRouter();
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialProvider = settings?.aiProvider || "openai-compatible";
  const initialPreset = getAiProviderPreset(initialProvider);
  const [provider, setProvider] = useState(initialProvider);
  const [baseUrl, setBaseUrl] = useState(
    settings?.aiBaseUrl ?? initialPreset.baseUrl,
  );
  const [model, setModel] = useState(
    settings?.aiModel ?? initialPreset.defaultModel,
  );
  const [apiKey, setApiKey] = useState("");
  const [clearApiKey, setClearApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const selectedPreset = getAiProviderPreset(provider);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError(null);

    try {
      await updateAiSettings(new FormData(event.currentTarget));
      setApiKey("");
      setClearApiKey(false);
      setSaved(true);
      router.refresh();

      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }

      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setSaveError(getErrorMessage(error, "AI 配置保存失败，请稍后重试。"));
    } finally {
      setSaving(false);
    }
  }

  function handleProviderChange(nextProvider: string) {
    const preset = getAiProviderPreset(nextProvider);
    setProvider(nextProvider);
    setBaseUrl(preset.baseUrl);
    setModel(preset.defaultModel);
    setSaved(false);
    setSaveError(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-border/70 bg-card p-5"
    >
      <div className="border-b border-border/60 pb-5">
        <h2 className="text-base font-semibold">绑定 AI 服务</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          选择服务商和模型，填写 API Key 后保存绑定。API Key
          只在服务端加密保存。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="aiProvider">服务商</Label>
          <select
            id="aiProvider"
            name="aiProvider"
            value={provider}
            onChange={(event) => handleProviderChange(event.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {AI_PROVIDER_PRESETS.map((providerPreset) => (
              <option key={providerPreset.id} value={providerPreset.id}>
                {providerPreset.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {selectedPreset.description}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aiModel">模型名称</Label>
          <Input
            id="aiModel"
            name="aiModel"
            value={model}
            onChange={(event) => setModel(event.target.value)}
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
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder="https://api.example.com/v1"
          inputMode="url"
          required
        />
        {selectedPreset.docsUrl ? (
          <p className="text-xs text-muted-foreground">
            请以服务商官方文档为准，必要时可以直接修改 Base URL。
            <a
              href={selectedPreset.docsUrl}
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
          value={apiKey}
          onChange={(event) => {
            setApiKey(event.target.value);
            if (event.target.value) {
              setClearApiKey(false);
            }
          }}
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
              checked={clearApiKey}
              onChange={(event) => {
                setClearApiKey(event.target.checked);
                if (event.target.checked) {
                  setApiKey("");
                }
              }}
            />
            清除已保存的 API Key
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "保存中..." : "保存并绑定"}
        </Button>
        <div aria-live="polite" className="text-sm">
          {saved ? (
            <span className="text-emerald-600">AI 配置已保存</span>
          ) : null}
          {saveError ? (
            <span className="text-destructive">{saveError}</span>
          ) : null}
        </div>
      </div>
    </form>
  );
}
